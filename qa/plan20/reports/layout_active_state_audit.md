# Layout & Sidebar active state Audit - Plan 20 QA Verification

This report documents the verification of the global layout (header, sidebar, role selector, language switcher) on the live workspace deployment.

## 1. Global Header Verification
- **Logo & Service Name**: Correctly shows **EUMDI OS** on the top-left section.
- **Languages Toggles**: Displays `KOR` and `VIET` buttons next to the role switcher.
- **Impersonator Selector**: Dropdown showing roles like `System Admin (Super Admin)`, `PM`, `Worker`, etc. works cleanly.
- **Operational Mode Badges**:
  - `실사용 모드` / `운영 검증` buttons are styled properly.
  - `데이터: JSON 운영` status badge is displayed in the header next to user settings.

---

## 2. Multi-language (KOR/VIET) Toggle Audit
Toggling between language views correctly translates static UI elements in real-time.

- **Korean View (KOR)**: Sidebar labels show correct Korean translations (e.g. `대시보드`, `수주/개발 관리`, `통합 프로젝트 보드`, `결재/수정 내역`).
- **Vietnamese View (VIET)**: Sidebar labels display correct Vietnamese translations mapping the UI messages:
  - `대시보드` -> `Bảng điều khiển`
  - `수주/개발 관리` -> `Quản lý Đặt hàng/Phát triển`
  - `통합 프로젝트 보드` -> `Bảng dự án tổng hợp`
  - `결재/수정 내역` -> `Lịch sử Phê duyệt`
  - `일정 충돌 관리` -> `Quản lý Xung đột Lịch`
  - `통합 일정표` -> `Lịch trình tổng hợp`
  - `알림 센터` -> `Trung tâm Thông báo`
  - `운영 설정` -> `Cài đặt Vận hành`

---

## 3. Sidebar Active State & Highlighting
Clicking each sidebar menu item transitions the active state:
- Selected item receives the active styling (indigo text with a clean blue-indigo highlight line/background container).
- The transition is instant and correct.
- Active states mapping is 100% accurate across all routes.

---

## 4. Role Impersonation and Space Audit
- **Admin**: Displays average count statistics cards, month selectors, and JSON action buttons.
- **PM**: Displays "부서 PM 기준 전체 업무 현황" with localized department values.
- **Worker**: Restricts visibility to worker scope, displaying "부서 작업자 기준 전체 업무 현황".
- **Vietnamese/Long names alignment**: The header profile space adjusts properly for longer names without wrapping onto multiple lines or overflowing the box limits.
