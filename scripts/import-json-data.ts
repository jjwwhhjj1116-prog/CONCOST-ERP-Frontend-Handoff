import fs from 'fs';
import path from 'path';

const JSON_DIR = path.join(__dirname, '../json');
const SOURCE_FILE = path.join(JSON_DIR, 'workspace-export.json');
const TARGET_FILE = path.join(__dirname, '../src/data/operationData.ts');

const importJsonData = () => {
  console.log('[Import] Starting import from workspace-export.json...');
  
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`[Error] Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(SOURCE_FILE, 'utf-8');
    const data = JSON.parse(rawData);
    
    // Validate schema
    if (data.schemaVersion !== '1.0.0') {
      console.error(`[Error] Invalid schemaVersion: ${data.schemaVersion}`);
      process.exit(1);
    }

    // Write to TypeScript file to be bundled by Next.js
    const tsContent = `// Auto-generated from workspace-export.json
import { Project, TaskCard, PersonnelCard, WorkspaceSetting, TaskWorkSegment, ApprovalRequest, RevisionRequest, PostDeliveryWorkRequest, Notification, PersonalSchedule } from '@/types/models';

export const operationData = {
  data: {
    projects: ${JSON.stringify(data.data.projects, null, 2)} as unknown as Project[],
    tasks: ${JSON.stringify(data.data.tasks, null, 2)} as unknown as TaskCard[],
    taskWorkSegments: ${JSON.stringify(data.data.taskWorkSegments || [], null, 2)} as unknown as TaskWorkSegment[],
    personnel: ${JSON.stringify(data.data.personnel, null, 2)} as unknown as PersonnelCard[],
    settings: ${JSON.stringify(data.data.settings, null, 2)} as unknown as WorkspaceSetting[],
    approvalRequests: ${JSON.stringify(data.data.approvalRequests || [], null, 2)} as unknown as ApprovalRequest[],
    revisionRequests: ${JSON.stringify(data.data.revisionRequests || [], null, 2)} as unknown as RevisionRequest[],
    postDeliveryWorkRequests: ${JSON.stringify(data.data.postDeliveryWorkRequests || [], null, 2)} as unknown as PostDeliveryWorkRequest[],
    notifications: ${JSON.stringify(data.data.notifications || [], null, 2)} as unknown as Notification[],
    personalSchedules: ${JSON.stringify(data.data.personalSchedules || [], null, 2)} as unknown as PersonalSchedule[],
  }
};
`;

    fs.writeFileSync(TARGET_FILE, tsContent, 'utf-8');
    console.log(`[Success] Data imported to ${TARGET_FILE}`);
  } catch (error) {
    console.error('[Error] Failed to import JSON:', error);
    process.exit(1);
  }
};

importJsonData();
