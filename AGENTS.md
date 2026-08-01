# CON-COST ERP DEVELOPMENT RULES

## 작업 기본원칙

- 사용자가 승인한 현재 요청 범위만 수정한다.
- 이전 대화의 완료 보고가 아니라 현재 코드와 실제 동작을 기준으로 판단한다.
- 정상 동작하는 기존 기능은 삭제하거나 불필요하게 재작성하지 않는다.
- 기능 구현과 파일 이동·폴더 리팩터링을 같은 작업에 섞지 않는다.
- 요청과 무관한 리팩터링, 이름 변경, dependency 변경을 하지 않는다.
- mock, fixture, placeholder, localStorage 데이터를 운영 완료 기능으로 보고하지 않는다.
- 운영 데이터는 서버 DB와 API가 SSOT다.
- 권한은 UI와 서버 양쪽에서 검증한다.
- 프로젝트는 canonical projectId로 연결하며 프로젝트명 문자열 매칭을 사용하지 않는다.
- 실제 개인정보, 인증정보, 비밀키를 소스·fixture·브라우저 저장소에 넣지 않는다.

## 작업 시작 전 확인

모든 코드 작업 전에 반드시 확인한다.

- repository
- git remote
- current branch
- HEAD commit
- git status
- working tree
- 기존 dirty 변경
- 수정 대상 모듈
- 수정 허용 파일
- 수정 금지 파일
- 관련 route
- 관련 API
- 관련 DB model
- 관련 permission
- 관련 test

working tree가 dirty이면 기존 변경과 새 작업을 분리한다.

다른 작업의 변경이 섞일 위험이 있으면
임의로 정리하지 말고 사용자에게 BLOCKED로 보고한다.

## 상태 분류

모든 요구사항은 구현 전에 다음으로 분류한다.

- COMPLETE
- PARTIAL
- MISSING
- BROKEN
- CONFLICT
- UNKNOWN

COMPLETE 항목은 회귀검사만 하고 재작성하지 않는다.

## 파일 변경계획

코드 작성 전에 다음 표를 작성한다.

| 파일 | 현재 역할 | 변경 이유 | 영향 기능 | 검증 |
|---|---|---|---|---|

계획에 없는 파일은 수정하지 않는다.

공용 파일을 수정할 경우 다음 영향을 반드시 조사한다.

- 로그인
- Workspace 홈
- App Shell
- 메일
- 전자결재
- 일정
- 프로젝트
- 프로젝트 접수
- 프로젝트 일정
- 프로젝트 질의사항
- 영업
- 재무
- 클레임
- 조직도
- Drive
- KR/VI 전환
- 통합검색

## 모듈 경계

신규 기능은 가능한 경우 아래 모듈 구조를 사용한다.

Frontend:

- modules/auth
- modules/workspace
- modules/mail
- modules/approvals
- modules/projects
- modules/project-intake
- modules/project-schedule
- modules/project-qc
- modules/sales
- modules/finance
- modules/claims
- modules/claim-service
- modules/drive
- modules/hr

Backend:

- server/src/domains/<module>
- server/src/integrations/<integration>
- server/src/jobs/<job>

현재 구조에 해당 폴더가 없다고 일반 기능 작업 중 임의로 전체 파일을 이동하지 않는다.

파일 이동은 `$module-refactor` 전용 작업에서만 수행한다.

## 스킬 사용 기준

일반 기능 수정:

$safe-feature-change

전체 회귀검사:

$regression-gate

offday2, Groupware-System-3 등 원본 기능 이식:

$legacy-feature-parity

UI 품질·가독성·반응형 검수:

$ui-quality-review

폴더·모듈 구조 정리:

$module-refactor

작업에 적합한 스킬을 명시적으로 호출하고,
SKILL.md의 절차와 본 AGENTS.md를 함께 따른다.

## 파일 이동 규칙

일반 기능 작업 중 파일 이동 금지.

파일 이동은 다음 조건에서만 허용한다.

- clean working tree
- 안정적인 base commit
- 원격 또는 별도 백업
- 전용 refactor branch
- 사용자 승인
- 한 모듈씩 이동
- 기능 변경 없음
- 모듈별 별도 커밋
- rollback 가능

## 필수 검증

변경 후 프로젝트에서 실제 사용 가능한 명령을 확인해 실행한다.

- lint
- typecheck
- unit test
- integration test
- build
- git diff --check

관련 화면을 실제 브라우저에서 확인한다.

- 정상
- loading
- empty
- error
- forbidden
- direct route
- refresh
- back/forward
- mobile
- KR/VI
- console error

## Git 규칙

- 커밋 하나에는 하나의 목적만 담는다.
- 기능 구현과 구조 리팩터링을 섞지 않는다.
- 관련 없는 dirty 파일을 stage하지 않는다.
- 작업 완료 후 가능한 경우 working tree를 clean으로 만든다.
- 사용자가 명시하지 않으면 Push하지 않는다.

## 완료 보고

“모두 반영했습니다”만 작성하지 않는다.

반드시 보고한다.

- branch
- base
- head
- working tree
- 변경 파일
- 구현 기능
- 보존한 기존 기능
- 테스트 명령과 결과
- 브라우저 검증
- console 결과
- PARTIAL
- BLOCKED
- commit SHA
- Push 여부

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
