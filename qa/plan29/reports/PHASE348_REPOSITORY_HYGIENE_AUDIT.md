# PHASE348 REPOSITORY HYGIENE AUDIT REPORT

## 1. 임시 파일 및 Lock File 추적 상태
Git 트래킹 중인 파일 중 저장소 품질을 저하시키는 임시 파일/Lock 파일을 식별했습니다.
- `~$Lo_trinh_ESC 2 (Translated)(1).xlsx` (165 bytes): MS Office Lock 파일이 실수로 커밋됨 (OBS-29-001) -> **DELETE_CANDIDATE**
- `src/data/mockData.ts.tmp`: 불필요한 스크립트 임시 산출물 -> **DELETE_CANDIDATE**
- 기타 로컬 영역에만 존재하고 추적되지 않는 `(구조팀) VN 스케줄표_2026.07.01(1).xlsx` 등 대형 바이너리는 배포 품질에 영향을 주지 않으므로 현행 유지.

## 2. `.gitignore`와 실제 추적 파일 대조
- `.gitignore`에는 `/node_modules`, `/.next/`, `/out/`, `/build` 등 Next.js 정적 빌드와 관련된 주요 제외 설정이 잘 선언되어 있습니다.
- `*.xlsx`나 `~$*`와 같은 Office lock 파일 제외 패턴, `.tmp` 제외 패턴이 선언되어 있지 않아 위 파일들이 커밋된 것으로 파악됩니다.
- 수정 제안: `.gitignore`에 `~$*`, `*.tmp`, `*.xlsx` (의도된 파일 제외) 패턴 보강.

## 3. 비밀값, 환경 변수 및 설정 하드코딩 조사
- **.env 파일**: 저장소 내 트래킹 중이거나 로컬 루트에 존재하는 `.env` 파일 없음.
- **번역 Provider (LibreTranslate / MyMemory 등)**: 
  - `src/lib/translation/providers.ts` 및 `translationStore.ts` 등을 조사한 결과, API 키나 이메일 주소(Secret)가 코드 내에 하드코딩된 사례는 없습니다.
  - JSON Handoff(`jsonHandoff.ts`) 시 `sanitizedTranslationSettings.libreTranslateEndpoint`에서 민감 정보를 안전하게 제외하고 내보내는 방어 로직이 정상 작동하고 있습니다.

## 4. 정적 배포 입력물 구분
- **GitHub Pages 필요 파일**: `src/*`, `public/*`, `next.config.ts`, `package.json`, `tailwind.config`, `tsconfig.json` 등 Next.js Static Export 빌드(`npm run build` -> `out/`)에 필요한 원본 소스코드.
- **불필요한 배포 포함 우려 파일**: 위 식별된 **DELETE_CANDIDATE** 및 `docs/` 디렉토리 내 방대한 텍스트 프롬프트. (이들은 GitHub Repository 용량을 차지하지만 `out/` 정적 빌드엔 포함되지 않으므로 서비스 성능에는 영향을 미치지 않음.)

## 5. 결론 및 조치 계획
- 비밀번호나 환경 변수 유출은 발견되지 않았습니다 (Hygiene PASS).
- 엑셀 Lock 파일(`~$`) 등은 Phase 369 이슈 매트릭스에 기록하고, 수정(Patch) 승인이 나는 Phase 372에서 `.gitignore` 보강과 함께 일괄 삭제(제거)할 예정입니다. 현재는 `DELETE_CANDIDATE` 로만 분류하며 수정하지 않았습니다.
