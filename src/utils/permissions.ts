import { Role, PersonnelCard, Project, TaskCard } from '@/types/models';

export const canViewProject = (user: PersonnelCard, project: Project): boolean => {
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'DEPARTMENT_MANAGER') return user.departmentId === project.departmentId;
  if (user.role === 'PM') return user.id === project.pmId;
  if (user.role === 'WORKER') return true; // Workers might need to see project details if assigned tasks, usually limited
  return false;
};

export const canEditTask = (user: PersonnelCard, task: TaskCard): boolean => {
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'DEPARTMENT_MANAGER') return user.departmentId === task.departmentId;
  if (user.role === 'PM') return user.id === task.pmId;
  if (user.role === 'WORKER') return user.id === task.assigneeId;
  return false;
};

export const getRolePermissions = (role: Role) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        canRegisterProject: true,
        canAssignPM: true,
        canDraftSchedule: true,
        canApproveSchedule: true,
        canRejectSchedule: true,
        canCreateTask: true,
        canReorderTask: true,
        canUpdateProgress: true,
        canApplyOvertime: true,
        canApproveOvertime: true,
        canViewAllSchedules: true,
      };
    case 'DEPARTMENT_MANAGER':
      return {
        canRegisterProject: true,
        canAssignPM: true,
        canDraftSchedule: true,
        canApproveSchedule: true,
        canRejectSchedule: true,
        canCreateTask: true,
        canReorderTask: true,
        canUpdateProgress: true,
        canApplyOvertime: true,
        canApproveOvertime: true,
        canViewAllSchedules: true, // within department
      };
    case 'PM':
      return {
        canRegisterProject: true,
        canAssignPM: false,
        canDraftSchedule: true,
        canApproveSchedule: false,
        canRejectSchedule: false,
        canCreateTask: true,
        canReorderTask: true,
        canUpdateProgress: true,
        canApplyOvertime: true,
        canApproveOvertime: false, // limited
        canViewAllSchedules: false, // within team only
      };
    case 'WORKER':
      return {
        canRegisterProject: false,
        canAssignPM: false,
        canDraftSchedule: true,
        canApproveSchedule: false,
        canRejectSchedule: false,
        canCreateTask: false, // can apply, but not create official
        canReorderTask: false, // limited
        canUpdateProgress: true, // only own
        canApplyOvertime: true,
        canApproveOvertime: false,
        canViewAllSchedules: false, // only own
      };
  }
};
