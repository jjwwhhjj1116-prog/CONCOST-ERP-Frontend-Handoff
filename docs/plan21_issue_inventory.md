# Plan 21 - QA 이슈 및 수정 대상 파일 목록 (File Inventory)

본 문서는 Plan 20 QA 검수 결과(`FINAL_QA_SUMMARY_REPORT.md` 및 23개 세부 리포트)를 바탕으로, Plan 21에서 수정해야 할 이슈와 그에 해당하는 타겟 소스코드 파일을 정리한 목록입니다.

## 1. UI/UX 수정 타겟
| 이슈 명 | 현상 요약 | 타겟 파일 |
| --- | --- | --- |
| **모달 Backdrop 외부 클릭 닫기 미동작** | 팝업 외부 딤(Dim) 영역 클릭 시 모달이 닫히지 않음 | `src/components/board/TaskDetailModal.tsx`<br>`src/components/board/PmDispatchModal.tsx`<br>`src/components/board/ScheduleRequestModal.tsx`<br>`src/components/board/RevisionRequestModal.tsx` (필요 시) |
| **태스크 모달 헤더 담당자 누락** | 모달 헤더 영역에 담당자(Assignee) 정보가 표시되지 않고 탭 안으로 숨겨져 있음 | `src/components/board/TaskDetailModal.tsx` |

## 2. 기능 구현 누락 복구 타겟
| 이슈 명 | 현상 요약 | 타겟 파일 |
| --- | --- | --- |
| **결재(Approval) 처리 프론트엔드 누락** | 결재 스토어 로직은 완벽하나, PM이 결재 대기 목록을 보고 승인할 수 있는 UI 탭과 모달이 전혀 없음 | `src/app/projects/page.tsx` (HISTORY 뷰 내 탭 추가)<br>`src/components/board/ApprovalReviewModal.tsx` (신규 모달 필요) |
| **외주 정산(Billing) 모듈 누락** | 협업 보드의 카드에 정산 데이터가 없고, 상세 모달 내에 비용을 입력할 정산 탭이 통째로 누락됨 | `src/components/board/TaskDetailModal.tsx`<br>`src/components/board/TaskCardItem.tsx`<br>`src/store/taskStore.ts` (정산 관련 상태 필드 추가) |
| **이력(History) 뷰 기능 미달** | 필터(전체/결재/완료) 누락, 글로벌 Audit Log 미매핑, 드릴다운 미구현 | `src/app/projects/page.tsx` |
| **소통 멘션 및 번역 누락** | 진행 메모 란에 다국어 번역 시스템 부재, `@멘션` 인식 및 알림 연동 부재 | `src/components/board/TaskDetailModal.tsx`<br>`src/store/taskStore.ts` (`updateTaskProgress` 내 알림 로직) |

## 3. 데이터 무결성 및 보안 결함 복구 타겟
| 이슈 명 | 현상 요약 | 타겟 파일 |
| --- | --- | --- |
| **권한 격리(Role Isolation) 붕괴** | 비인가자가 타인의 태스크 진행률 갱신, 세부 작업/블로커 무단 삭제 가능 | `src/components/board/TaskDetailModal.tsx` (렌더링 방어)<br>`src/store/taskStore.ts` (액션단 방어 로직) |
| **워크플로우 상태 전이 방어 부재** | 드래그 앤 드롭 시 공정 단계를 무시하고 강제 이동시키는 것(건너뛰기)이 허용됨 | `src/components/board/Board.tsx` (`handleDragEnd`)<br>`src/store/taskStore.ts` (`updateDetailedLineStage`) |
| **진행률 ↔ 상태 자동 동기화 단절** | 진행률이 최초로 올라갔을 때 상태가 '대기 중'에서 '진행 중'으로 자동 승격되지 않음 | `src/store/taskStore.ts` (`updateTaskProgress`) |
| **로컬 영속성(Persist) 부재** | 새로고침(F5) 시 모든 프로젝트/상태 데이터가 증발함 (DB 전 단계) | `src/store/taskStore.ts`<br>`src/store/projectStore.ts`<br>`src/store/approvalStore.ts` 등 주요 스토어 |

> **원칙사항:**
> Plan 21은 상기 목록에 명시된 QA 결함 수정만을 타겟으로 하며, 리포트에 존재하지 않는 새로운 기능은 임의로 추가하지 않습니다.
