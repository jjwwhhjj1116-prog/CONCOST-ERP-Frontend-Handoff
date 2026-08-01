import { PersonnelCard, Project, TaskCard, ApprovalRequest, Notification, AuditLog, PersonalSchedule } from '@/types/models';
import { 
  samplePersonnelCards, 
  sampleProjects, 
  sampleTaskCards, 
  samplePersonalSchedules 
} from './workspaceScheduleSeed';

import dummyPersonnel from './dummyPersonnel.json';

export const coreUsers: PersonnelCard[] = dummyPersonnel.personnel as unknown as PersonnelCard[];

export const mockUsers: PersonnelCard[] = dummyPersonnel.personnel as unknown as PersonnelCard[];

export const mockProjects: Project[] = [...sampleProjects];

export const mockTasks: TaskCard[] = [...sampleTaskCards];

export const mockPersonalSchedules: PersonalSchedule[] = [...samplePersonalSchedules];

export const mockApprovalRequests: ApprovalRequest[] = [];
export const mockNotifications: Notification[] = [];
export const mockAuditLogs: AuditLog[] = [];
