// Auto-generated from workspace-export.json
import { Project, TaskCard, PersonnelCard, WorkspaceSetting, TaskWorkSegment, ApprovalRequest, RevisionRequest, PostDeliveryWorkRequest, Notification, PersonalSchedule } from '@/types/models';

import dummyPersonnel from './dummyPersonnel.json';

export const operationData = {
  data: {
    projects: [] as unknown as Project[],
    tasks: [] as unknown as TaskCard[],
    taskWorkSegments: [] as unknown as TaskWorkSegment[],
    personnel: dummyPersonnel.personnel as unknown as PersonnelCard[],
    settings: [] as unknown as WorkspaceSetting[],
    approvalRequests: [] as unknown as ApprovalRequest[],
    revisionRequests: [] as unknown as RevisionRequest[],
    postDeliveryWorkRequests: [] as unknown as PostDeliveryWorkRequest[],
    notifications: [] as unknown as Notification[],
    personalSchedules: [] as unknown as PersonalSchedule[],
  }
};
