# Current UI and Function Gap Audit

## Audit Basis

- Date: 2026-07-23
- Branch baseline: `feat/login-board-refresh` at `48997ee`
- Evidence rule: current source, rendered browser UI, interactive behavior, automated tests, lint, and production build only
- Previous completion reports were not used as evidence.
- `COMPLETE` items were regression-tested without implementation changes.
- Only `PARTIAL`, `MISSING`, `BROKEN`, or `CONFLICT` items were changed.

## A. Current Request Classification

| ID | Requirement | Initial status | Current status | Evidence and action |
|---|---|---:|---:|---|
| A-0 | Login hero, exact Korean line break, company links/logos, KO/EN/VI, demo login | COMPLETE | COMPLETE | `loginContent.ts` contains the exact two headline lines, four service links including ESC, and three languages. Browser confirmed the two-line heading and login controls. Regression only. |
| A-1 | Large high-contrast sidebar icons and requested information architecture | COMPLETE | COMPLETE | `Sidebar.tsx` contains the CON-COST/VIETQS brand switch, project/drive/schedule/questions hierarchy, enlarged rail icons, and mobile bottom navigation. Browser confirmed menu rendering. Regression only. |
| A-2 | Project/team hierarchy, questions workspace, and protected drive structure | COMPLETE | COMPLETE | Required technical/claim/development project groups, schedule groups, question groups, and drive groups are present. Question workspace provides filtering, grouping, comments, attachments metadata, history, templates, bulk actions, terminology, and export. Drive remains a secured UI boundary pending Google integration. Regression only except width fix under B-8. |
| A-3 | Four-step project intake migrated from OFFDAY2 | COMPLETE | COMPLETE | Browser confirmed `프로젝트 접수`; source provides four steps, previous/next navigation, draft/review/complete flow, five seeded material rows, contacts, schedule, requester data, text requests, and document attachment formats. Regression only. |
| A-4 | Directive 20 claim/secure Drive/local AI program | PARTIAL | PARTIAL | `CLM-00/01/02` and `AI-00` read-only discovery are complete. Claim domains, Drive integration, local AI gateway/RAG, workers, migrations, and CLM-03+ implementation are not present. Kept separate from this UI commit. |
| A-5 | Organization chart and imported company accounts | PARTIAL | COMPLETE | Both personnel JSON files contain 94 matching accounts with no duplicate IDs. Added a real directory backed by the auth users: search, company filters, account/company/team/manager summaries, and department/team grouping. Browser confirmed 94 accounts, 2 companies, 16 teams, and 10 manager/approver candidates. |
| A-6 | VIETQS brand mode and business-grade email workspace | PARTIAL | COMPLETE | Brand switching was already present. Mail already had folders, summaries, search, compose, selection, move/delete/spam/reminder actions. Added real project-folder filtering, selected row state, message detail, sender metadata, attachment list, reply/reply-all/forward actions. Browser verified all paths. |
| A-7 | Project schedule with calendar/timeline/load/PM modes and staffing | COMPLETE | COMPLETE | Source contains approved-task schedule derivation, PM/assignee staffing, work-scope display, calendar/timeline/load/PM modes, and `인력·공종 배정`. Schedule tests pass. Regression only. |

## B. Previous Request Revalidation

| ID | Requirement | Initial status | Current status | Evidence and action |
|---|---|---:|---:|---|
| B-1 | OFFDAY2 project lifecycle parity | COMPLETE | COMPLETE | Current project workspace and stores cover intake, PM schedule, task/QC, delivery, daily report, profit, workflow history, and legacy estimate templates. Automated workflow tests pass. Regression only. |
| B-2 | Mail UI and productivity functions | PARTIAL | COMPLETE | Completed under A-6. |
| B-3 | Full calendar and event registration | COMPLETE | COMPLETE | Browser showed a 6-week calendar, today/upcoming panels, per-day add actions, and the new-event modal with category, visibility, start/end, and memo. Regression only. |
| B-4 | User-selectable home widgets and linked KPI/approval/sales views | COMPLETE | COMPLETE | Browser confirmed widget settings plus project, KPI, approval, sales, priority task, and schedule widgets. Widget cards link to their operational screens. JSON import/export is displayed for the signed-in administrator. Regression only. |
| B-5 | Electronic approval templates, approval line, submit/approve/reject/cancel | COMPLETE | COMPLETE | Browser opened the template selector and vacation form. It confirmed the technical director, vice president, and CEO approval line and submit/cancel controls. Source contains approve, reject, and submit-cancel guards. Regression only. |
| B-6 | Sidebar icon scale and menu structure | COMPLETE | COMPLETE | Covered by A-1. Regression only. |
| B-7 | OFFDAY2 project question management | COMPLETE | COMPLETE | Covered by A-2. Regression only. |
| B-8 | Content should expand at wide browser sizes | PARTIAL | COMPLETE | Removed fixed `max-w-[1540px]` caps from Drive, questions, data management, and daily report workspaces. Browser checks at 1920 px reported no horizontal overflow on the tested core routes. |
| B-9 | Login visual and functional requirements | COMPLETE | COMPLETE | Covered by A-0. Regression only. |
| B-10 | ESC logo and brand mode | COMPLETE | COMPLETE | Login includes the ESC service asset/link; sidebar brand mode switches CON-COST and VIETQS presentation. Regression only. |

## Browser Evidence

- Organization directory: 94 active accounts, 2 companies, 16 teams, 10 manager/approver candidates.
- Mail: list -> detail, sender metadata, one attachment, reply, reply-all, forward, and project folder filter.
- Dashboard: project, KPI, approval, sales, priority task, and calendar links are present.
- Approvals: template selection and three-stage approval line are rendered.
- Calendar: 42 day cells and the event creation form are rendered.
- Schedule: calendar, timeline, personal load, PM management, and leave/event registration modes are present.
- Desktop: core tested routes at 1920 px have no horizontal overflow.
- Mobile: mail and organization at 390 x 844 have no horizontal overflow.
- Browser console: 0 errors and 0 warnings during the final interaction pass.

## Automated Validation

- `npm test`: 24/24 passed.
- `npm run lint`: 0 errors; 17 existing warnings.
- `npm run build`: passed; 35 static routes generated.
- `git diff --check`: passed.
- Personnel JSON parity: 94/94 identical records, duplicate IDs 0/0, administrator role confirmed.

## Directive 20 Separation

The secure claim consulting, Google Drive, and local AI program remains a separate track.

- Completed: CLM-00, CLM-01, CLM-02, AI-00 read-only discovery.
- Next deliverable: CLM-03 target architecture package covering ERD, state models, API contracts, permission model, ADRs, migration, and rollback.
- Blockers: Google Workspace edition/admin security capabilities, final role/security policy, deployment runtime, local AI model/API/security posture, OCR/STT scope, report approval policy, and retention/legal-hold policy.
- No Claim, Google Drive, AI, server, migration, token, or tenant changes are included in the UI commit.
