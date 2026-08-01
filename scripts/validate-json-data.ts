import fs from 'fs';
import path from 'path';

const JSON_DIR = path.join(__dirname, '../json');
const TARGET_FILE = path.join(JSON_DIR, 'workspace-export.json');

const validateJsonData = () => {
  console.log('[Validation] Checking JSON handoff data...');
  if (!fs.existsSync(TARGET_FILE)) {
    console.error(`[Error] File not found: ${TARGET_FILE}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(TARGET_FILE, 'utf-8');
    const data = JSON.parse(rawData);

    if (data.schemaVersion !== '1.0.0') {
      console.error(`[Error] Invalid schemaVersion: ${data.schemaVersion}. Expected 1.0.0`);
      process.exit(1);
    }

    if (!data.data || !Array.isArray(data.data.projects) || !Array.isArray(data.data.personnel) || !Array.isArray(data.data.settings)) {
      console.error('[Error] Invalid data structure. Missing projects, personnel, or settings array.');
      process.exit(1);
    }

    let hasError = false;

    // Validate projects
    data.data.projects.forEach((p: any) => {
      if (p.projectSourceType === 'INTERNAL_DEVELOPMENT' && !p.targetDate) {
        console.error(`[Error] Project ${p.id} (INTERNAL_DEVELOPMENT) is missing targetDate.`);
        hasError = true;
      }
      if (p.projectSourceType === 'CLIENT_ORDER' && !p.deliveryDate) {
        console.error(`[Error] Project ${p.id} (CLIENT_ORDER) is missing deliveryDate.`);
        hasError = true;
      }
    });

    // Validate tasks
    if (Array.isArray(data.data.tasks)) {
      const projectIds = new Set(data.data.projects.map((p: any) => p.id));
      const userIds = new Set(data.data.personnel.map((u: any) => u.id));
      data.data.tasks.forEach((t: any) => {
        if (!projectIds.has(t.projectId)) {
          console.error(`[Error] Task ${t.id} references missing project: ${t.projectId}`);
          hasError = true;
        }
        if (t.assigneeId && !userIds.has(t.assigneeId)) {
          console.error(`[Error] Task ${t.id} references missing assignee: ${t.assigneeId}`);
          hasError = true;
        }
      });
    }

    if (hasError) {
      process.exit(1);
    }

    console.log(`[Success] Validation passed. Found ${data.data.projects.length} projects and ${data.data.personnel.length} personnel records.`);
  } catch (error) {
    console.error('[Error] Failed to parse JSON:', error);
    process.exit(1);
  }
};

validateJsonData();
