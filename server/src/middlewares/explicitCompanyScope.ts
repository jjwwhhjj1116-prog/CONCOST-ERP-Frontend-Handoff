import { NextFunction, Request, Response } from 'express';
import {
  canAccessCompany,
  getAllowedCompanyIds,
  isCompanyId,
} from '../domain/companyAccess';

export const requireExplicitCompanyScope = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestedCompanyId = req.header('x-company-id');
  if (!requestedCompanyId) {
    return res.status(400).json({ error: 'X-Company-Id header is required' });
  }

  const actor = req.user!;
  const allowedCompanyIds = getAllowedCompanyIds(actor.role, actor.companyId);
  if (!isCompanyId(requestedCompanyId) || !canAccessCompany(allowedCompanyIds, requestedCompanyId)) {
    return res.status(403).json({ error: 'Forbidden: Company workspace access denied' });
  }

  res.locals.companyId = requestedCompanyId;
  next();
};

export const getExplicitCompanyId = (res: Response) => String(res.locals.companyId);
