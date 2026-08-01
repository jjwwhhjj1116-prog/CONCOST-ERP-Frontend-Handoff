# Source Organization

이 문서는 화면 단위 작업이 늘어나도 소스 위치를 빠르게 찾을 수 있도록 Workspace의 폴더 책임을 고정한다.

## Directory Contract

| 경로 | 책임 | 원칙 |
|---|---|---|
| `src/app/<route>` | Next.js 라우트 진입점 | 레이아웃, 메타데이터, 기능 컴포넌트 연결만 담당한다. |
| `src/features/<session>` | 세션 또는 업무 기능 | 화면, 기능 전용 모델, 문구, 로컬 상태를 한 폴더에 둔다. |
| `src/components` | 전역 공유 UI | 두 개 이상의 기능에서 실제로 재사용되는 컴포넌트만 둔다. |
| `src/store` | 여러 라우트가 공유하는 상태 | 인증, 프로젝트처럼 전역 생명주기가 필요한 상태만 둔다. |
| `src/lib` | 순수 로직과 외부 연동 | UI를 포함하지 않는 계산, API 클라이언트, 권한 로직을 둔다. |
| `src/types` | 공통 계약 | 여러 기능이 공유하는 타입과 서버 계약을 둔다. |
| `public/brand` | 브랜드 자산 | 배포 경로와 무관하게 제공되어야 하는 로고와 이미지 원본을 둔다. |

## Current Feature Sessions

### Authentication

- Route shell: `src/components/auth/AuthenticatedShell.tsx`
- Login UI: `src/components/auth/LoginExperience.tsx`
- Login content and company links: `src/features/auth/loginContent.ts`
- Credential verification: `src/lib/staticAuth.ts`
- Session state: `src/store/authStore.ts`

### Company Board

- Route: `src/app/board/page.tsx`
- Feature UI: `src/features/board/BoardWorkspace.tsx`
- Feature model and seed data: `src/features/board/boardModel.ts`
- Feature-local persisted state: `src/features/board/useBoardStore.ts`
- Navigation entry: `src/components/layout/Sidebar.tsx`

## Migration Rule

기존 파일을 폴더 정리만을 목적으로 일괄 이동하지 않는다. 기능을 수정하는 시점에 해당 기능을 `src/features/<session>`으로 점진적으로 분리하며, 각 단계에서 import 검사와 빌드를 통과시킨다. 이 방식은 Git 이력과 기존 라우트를 보존하면서 세션별 수정 범위를 명확하게 만든다.
