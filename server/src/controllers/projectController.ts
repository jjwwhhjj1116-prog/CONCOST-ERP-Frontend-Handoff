import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { getExplicitCompanyId } from '../middlewares/explicitCompanyScope';

const createProjectSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(1),
  status: z.string().min(1),
  managerId: z.string().min(1),
  pmId: z.string().min(1),
});

const projectQuerySchema = z.object({
  status: z.string().trim().min(1).max(100).optional(),
  managerId: z.string().trim().min(1).max(100).optional(),
  pmId: z.string().trim().min(1).max(100).optional(),
  assigneeId: z.string().trim().min(1).max(100).optional(),
  organizationId: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
}).strict();

const projectInclude = {
  manager: true,
  pm: true,
  tasks: true,
} satisfies Prisma.ProjectInclude;

const buildProjectWhere = (
  companyId: string,
  filters: z.infer<typeof projectQuerySchema>,
): Prisma.ProjectWhereInput => {
  const where: Prisma.ProjectWhereInput = { companyId };
  if (filters.status) where.status = filters.status;
  if (filters.managerId) where.managerId = filters.managerId;
  if (filters.pmId) where.pmId = filters.pmId;
  if (filters.assigneeId) {
    where.tasks = { some: { assigneeId: filters.assigneeId } };
  }
  if (filters.organizationId) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { manager: { departmentId: filters.organizationId } },
          { pm: { departmentId: filters.organizationId } },
          { tasks: { some: { assignee: { departmentId: filters.organizationId } } } },
        ],
      },
    ];
  }
  return where;
};

export const getProjects = async (req: Request, res: Response) => {
  const parsed = projectQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid project filters', details: parsed.error.issues });
  }

  try {
    const where = buildProjectWhere(getExplicitCompanyId(res), parsed.data);
    const paginated = parsed.data.page !== undefined || parsed.data.pageSize !== undefined;
    const page = parsed.data.page ?? 1;
    const pageSize = parsed.data.pageSize ?? 50;
    const projects = await prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      ...(paginated ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
    });
    if (!paginated) return res.status(200).json(projects);

    const total = await prisma.project.count({ where });
    return res.status(200).json({
      items: projects,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getProjectStats = async (req: Request, res: Response) => {
  const parsed = projectQuerySchema.omit({ page: true, pageSize: true }).safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid project filters', details: parsed.error.issues });
  }

  try {
    const where = buildProjectWhere(getExplicitCompanyId(res), parsed.data);
    const [total, grouped] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);
    return res.status(200).json({
      total,
      byStatus: Object.fromEntries(grouped.map((row) => [row.status, row._count._all])),
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: String(req.params.projectId) },
      include: projectInclude,
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.companyId !== getExplicitCompanyId(res)) {
      return res.status(403).json({ error: 'Forbidden: project is outside the selected company' });
    }
    return res.status(200).json(project);
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });

    const maxOrder = await prisma.project.aggregate({ _max: { orderIndex: true } });
    const orderIndex = (maxOrder._max.orderIndex || 0) + 1;

    const project = await prisma.project.create({
      data: {
        ...parsed.data,
        orderIndex,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const project = await prisma.project.update({
      where: { id: projectId },
      data: req.body,
    });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
