# Route Inventory - Plan 20 QA Audit

This inventory lists all accessible web routes for the Workspace application, including visible sidebar paths, hidden routes, and settings tabs.

## 1. Base Deployment URL
- **URL**: `https://eumditravel-oss.github.io/workspace/`
- **Base Path**: `/workspace`

---

## 2. Main Navigation Routes (Sidebar)
These routes are directly accessible from the sidebar menu.

| # | Menu Name (KOR) | Menu Name (VIET) | App Path | Complete Live URL | Priority |
|---|---|---|---|---|---|
| 1 | 대시보드 | Bảng điều khiển | `/` | `https://eumditravel-oss.github.io/workspace/` | P0 |
| 2 | 수주/개발 관리 | Quản lý Đặt hàng/Phát triển | `/projects/intake` | `https://eumditravel-oss.github.io/workspace/projects/intake` | P0 |
| 3 | 통합 프로젝트 보드 | Bảng dự án tổng hợp | `/projects` | `https://eumditravel-oss.github.io/workspace/projects` | P0 |
| 4 | 결재/수정 내역 | Lịch sử Phê duyệt | `/approvals` | `https://eumditravel-oss.github.io/workspace/approvals` | P1 |
| 5 | 일정 충돌 관리 | Quản lý Xung đột Lịch | `/conflicts` | `https://eumditravel-oss.github.io/workspace/conflicts` | P1 |
| 6 | 통합 일정표 | Lịch trình tổng hợp | `/schedules` | `https://eumditravel-oss.github.io/workspace/schedules` | P1 |
| 7 | 알림 센터 | Trung tâm Thông báo | `/notifications` | `https://eumditravel-oss.github.io/workspace/notifications` | P2 |
| 8 | 운영 설정 | Cài đặt Vận hành | `/settings` | `https://eumditravel-oss.github.io/workspace/settings` | P0 |

---

## 3. Sub-pages & Tabs (Settings Submenu)
These are sub-routes nested within Operation Settings.

| # | Settings Tab | Description | App Path | Complete Live URL | Priority |
|---|---|---|---|---|---|
| 1 | 운영 환경 | Workspace Operations Settings | `/settings/workspace` | `https://eumditravel-oss.github.io/workspace/settings/workspace` | P2 |
| 2 | 사원 관리 | Personnel Management | `/settings/personnel` | `https://eumditravel-oss.github.io/workspace/settings/personnel` | P2 |
| 3 | 일괄 마감 | Bulk Date Closure | `/settings/bulk-edit` | `https://eumditravel-oss.github.io/workspace/settings/bulk-edit` | P2 |
| 4 | 데이터 품질 | Data Quality Scanner | `/settings/data-quality` | `https://eumditravel-oss.github.io/workspace/settings/data-quality` | P2 |
| 5 | 가져오기 | Import JSON | `/settings/import` | `https://eumditravel-oss.github.io/workspace/settings/import` | P1 |
| 6 | 권한 정책 | Security & Permissions policies | `/settings/permissions` | `https://eumditravel-oss.github.io/workspace/settings/permissions` | P2 |
| 7 | 번역 설정 | Multi-language & Translation settings | `/settings/translation` | `https://eumditravel-oss.github.io/workspace/settings/translation` | P0 |

---

## 4. Other App Routes (Not directly in sidebar)
These are other utility routes found in the codebase.

| # | Route Name | Description | App Path | Complete Live URL | Priority |
|---|---|---|---|---|---|
| 1 | 성과 평가 | Performance Evaluation | `/evaluation` | `https://eumditravel-oss.github.io/workspace/evaluation` | P1 |
| 2 | 내 업무 | Personal tasks page | `/tasks/my` | `https://eumditravel-oss.github.io/workspace/tasks/my` | P1 |
| 3 | 프로젝트 상세 | Detailed project board | `/projects/[id]` (modal/routing) | `https://eumditravel-oss.github.io/workspace/projects` (modal trigger) | P0 |

---

## 5. Audit Validation Priorities
1. **P0 (Critical)**: Dashboard, Projects Board, Intake, Settings Main, Translation Settings, Project Details modal.
2. **P1 (High)**: Approvals, Conflicts, Schedules (integrated timeline), Evaluation, My Tasks.
3. **P2 (Medium)**: Nest Settings tabs (Data quality, bulk edit, permissions, personnel, workspace), Notifications.
