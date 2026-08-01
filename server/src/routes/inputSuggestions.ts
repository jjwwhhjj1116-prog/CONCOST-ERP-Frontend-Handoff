import { Request, Router } from 'express';
import { prisma } from '../lib/db';
import {
  isSuggestionFieldAllowed,
  normalizeSuggestionValue,
  rankSuggestion,
  resolveSuggestionCompanyScope,
} from '../domain/inputSuggestion';
import { getAllowedCompanyIds } from '../domain/companyAccess';
import { requireAuth, requireSystemAdmin } from '../middlewares/auth';

const router = Router();
const keyPattern = /^[a-z0-9_.-]{1,64}$/i;
const adminUpdateKeys = new Set(['isActive']);

router.use(requireAuth);

const selectedCompanyScope = (req: Request) =>
  resolveSuggestionCompanyScope({
    selectedCompanyId: req.header('x-company-id'),
    allowedCompanyIds: req.user
      ? getAllowedCompanyIds(req.user.role, req.user.companyId)
      : [],
  });

router.get('/admin', requireSystemAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const scope = selectedCompanyScope(req);
    if (!scope.ok) return res.status(scope.status).json({ error: scope.error });
    const suggestions = await prisma.inputSuggestion.findMany({
      where: { companyId: scope.companyId },
      orderBy: [{ isActive: 'desc' }, { lastUsedAt: 'desc' }],
      take: 500,
    });
    return res.json(suggestions);
  } catch (error) {
    return next(error);
  }
});

router.patch('/admin/:id', requireSystemAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const scope = selectedCompanyScope(req);
    if (!scope.ok) return res.status(scope.status).json({ error: scope.error });
    const bodyKeys = Object.keys(req.body || {});
    if (bodyKeys.length !== 1 || !adminUpdateKeys.has(bodyKeys[0]) || typeof req.body.isActive !== 'boolean') {
      return res.status(400).json({ error: 'Only isActive can be changed.' });
    }
    const existing = await prisma.inputSuggestion.findFirst({
      where: { id: String(req.params.id), companyId: scope.companyId },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'Suggestion not found.' });
    const updated = await prisma.inputSuggestion.update({
      where: { id: existing.id },
      data: { isActive: req.body.isActive },
    });
    await prisma.auditLog.create({
      data: {
        action: req.body.isActive ? 'INPUT_SUGGESTION_ENABLED' : 'INPUT_SUGGESTION_DISABLED',
        entityType: 'InputSuggestion',
        entityId: updated.id,
        actorId: user.personnelId,
        details: JSON.stringify({ companyId: scope.companyId, moduleKey: updated.moduleKey, fieldKey: updated.fieldKey }),
      },
    });
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.delete('/admin/:id', requireSystemAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const scope = selectedCompanyScope(req);
    if (!scope.ok) return res.status(scope.status).json({ error: scope.error });
    const existing = await prisma.inputSuggestion.findFirst({
      where: { id: String(req.params.id), companyId: scope.companyId },
      select: { id: true, moduleKey: true, fieldKey: true },
    });
    if (!existing) return res.status(404).json({ error: 'Suggestion not found.' });
    await prisma.$transaction(async (tx) => {
      await tx.inputSuggestion.delete({ where: { id: existing.id } });
      await tx.auditLog.create({
        data: {
          action: 'INPUT_SUGGESTION_DELETED',
          entityType: 'InputSuggestion',
          entityId: existing.id,
          actorId: user.personnelId,
          details: JSON.stringify({
            companyId: scope.companyId,
            moduleKey: existing.moduleKey,
            fieldKey: existing.fieldKey,
          }),
        },
      });
    });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const user = req.user!;
    const moduleKey = String(req.query.module || '').trim();
    const fieldKey = String(req.query.field || '').trim();
    const query = String(req.query.query || '').trim().slice(0, 160);
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
    const scope = selectedCompanyScope(req);
    if (!scope.ok) return res.status(scope.status).json({ error: scope.error });
    if (!keyPattern.test(moduleKey) || !isSuggestionFieldAllowed(fieldKey)) {
      return res.status(400).json({ error: 'Suggestion scope is not allowed.' });
    }

    const candidates = await prisma.inputSuggestion.findMany({
      where: {
        companyId: scope.companyId,
        moduleKey,
        fieldKey,
        isActive: true,
        ...(query ? { displayValue: { contains: query, mode: 'insensitive' } } : {}),
      },
      include: {
        uses: { where: { userId: user.personnelId }, select: { usageCount: true } },
      },
      orderBy: { lastUsedAt: 'desc' },
      take: 50,
    });

    const suggestions = candidates
      .map((candidate) => ({
        id: candidate.id,
        value: candidate.displayValue,
        usageCount: candidate.usageCount,
        userUsageCount: candidate.uses[0]?.usageCount || 0,
        lastUsedAt: candidate.lastUsedAt,
        score: rankSuggestion({
          value: candidate.displayValue,
          usageCount: candidate.usageCount,
          userUsageCount: candidate.uses[0]?.usageCount || 0,
          lastUsedAt: candidate.lastUsedAt,
        }),
      }))
      .sort((left, right) => right.score - left.score || left.value.localeCompare(right.value))
      .slice(0, limit);

    return res.json(suggestions);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const user = req.user!;
    const moduleKey = String(req.body?.module || '').trim();
    const fieldKey = String(req.body?.field || '').trim();
    const displayValue = String(req.body?.value || '').trim().replace(/\s+/g, ' ').slice(0, 160);
    const normalizedValue = normalizeSuggestionValue(displayValue);
    const scope = selectedCompanyScope(req);
    if (!scope.ok) return res.status(scope.status).json({ error: scope.error });
    if (!keyPattern.test(moduleKey) || !isSuggestionFieldAllowed(fieldKey) || normalizedValue.length < 2) {
      return res.status(400).json({ error: 'Suggestion value or scope is not allowed.' });
    }

    const suggestion = await prisma.$transaction(async (tx) => {
      const saved = await tx.inputSuggestion.upsert({
        where: {
          companyId_moduleKey_fieldKey_normalizedValue: {
            companyId: scope.companyId,
            moduleKey,
            fieldKey,
            normalizedValue,
          },
        },
        create: {
          companyId: scope.companyId,
          moduleKey,
          fieldKey,
          normalizedValue,
          displayValue,
          createdBy: user.personnelId,
        },
        update: {
          displayValue,
          isActive: true,
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });
      await tx.inputSuggestionUse.upsert({
        where: { suggestionId_userId: { suggestionId: saved.id, userId: user.personnelId } },
        create: { suggestionId: saved.id, userId: user.personnelId },
        update: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          action: 'INPUT_SUGGESTION_RECORDED',
          entityType: 'InputSuggestion',
          entityId: saved.id,
          actorId: user.personnelId,
          details: JSON.stringify({
            companyId: scope.companyId,
            moduleKey,
            fieldKey,
          }),
        },
      });
      return saved;
    });

    return res.status(201).json({ id: suggestion.id, value: suggestion.displayValue });
  } catch (error) {
    return next(error);
  }
});

export default router;
