# WORKSPACE PLAN 19 — KOR/VIET 다국어 전환, 공개 무료 번역 API 우선 연결, 업무카드 양방향 번역, 이중언어 UI/검수 워크플로우 프롬프트

이 프롬프트는 기존 `workspace plan1.txt`부터 `workspace plan18.txt` 이후에 추가되는 열아홉 번째 보강 지시사항이다.

Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다. 따라서 Plan 19는 Plan 1~18을 대체하지 않지만, 다국어/번역 기능에 대해서는 Plan 19의 기준을 최신 기준으로 우선 적용한다.

Plan 19의 목적은 Workspace 시스템에 다음을 추가하는 것이다.

1. Workspace 전체 UI의 `KOR / VIET` 언어 전환.
2. 한국 직원이 CON-COST에서 업무카드를 한국어로 작성하면 베트남어 번역 자동 생성.
3. 베트남 직원이 VIET_QS에서 업무카드를 베트남어로 작성하면 한국어 번역 자동 생성.
4. 정식 서버 운영 전 프로토타입 단계에서는 **인증키가 필요 없는 공개 무료 번역 API**를 우선 연결.
5. 단, 웹에서 임의의 API Key를 검색·수집·탈취·하드코딩하는 방식은 금지.
6. 원문과 번역문을 분리 저장하고, 자동번역 결과는 검수 전까지 공식 원문으로 취급하지 않음.
7. 한국어/베트남어 병기 UI를 업무자가 보기 좋은 구조로 설계.
8. Phase를 세분화하여 각 Phase 완료 후 자체검수, 사용자 승인, 이후 Phase 진행 방식 유지.

---

## 0. 사용자 최신 요구사항 반영

사용자는 다음을 추가로 요청했다.

```text
정식 운영 전이므로 유료/정식 번역 API 연동이 아니라 무료 번역 API를 우선 사용하고 싶다.
공개 API라면 Antigravity가 알아서 연결할 수 있게 해달라.
```

이를 다음 방식으로 해석하여 구현한다.

```text
허용:
- 공식 문서상 인증키 없이 사용할 수 있는 공개 무료 번역 endpoint 사용.
- 공식적으로 공개된 LibreTranslate mirror 중 API Key가 필요 없는 서버를 후보로 테스트.
- MyMemory처럼 공식 usage limit이 공개된 no-key API를 프로토타입 provider로 사용.
- 사용자가 제공한 이메일, API Key, self-host URL, proxy URL이 있으면 설정으로 연결.

금지:
- 인터넷에서 임의의 API Key를 검색해서 가져오기.
- GitHub, 블로그, 예제 코드에 노출된 타인의 API Key 사용.
- 비공식 Google Translate 우회 endpoint를 크롤링 또는 역공학하여 사용.
- Secret 또는 API Key를 프론트엔드 번들에 하드코딩.
- 무료 API 연결 실패 상태를 “자동번역 완료”로 보고.
```

즉, Plan 19의 구현 방향은 **Free Public Translation Provider 우선 연결**이다.  
API Key를 “알아서 끌어오기”가 아니라, **키 없이 공식적으로 호출 가능한 공개 API를 자동 탐색/설정 후보화**하는 것으로 구현한다.

---

## 1. 절대 원칙

Antigravity는 다음 원칙을 반드시 지켜라.

1. Plan 18의 검증 중심 원칙을 유지한다.
2. 먼저 현재 코드, route, store, JSON 구조, 실제 화면을 분석한다.
3. 사용자 승인 없이 다음 Phase로 넘어가지 않는다.
4. 사용자 승인 없이 GitHub 원격 push를 하지 않는다.
5. 원문을 번역문으로 덮어쓰지 않는다.
6. 번역문을 원문으로 덮어쓰지 않는다.
7. 자동번역 결과는 `AUTO_TRANSLATED` 또는 `HUMAN_REVIEW_REQUIRED` 상태로 저장한다.
8. 사람이 검수한 번역만 `HUMAN_APPROVED` 상태로 전환한다.
9. 한국어/베트남어 전환은 UI label, 업무카드 텍스트, 알림, 결재, JSON export/import까지 고려한다.
10. 무료 공개 API는 quota, rate limit, 장애, 개인정보/업무정보 외부 전송 리스크가 있으므로 fallback과 경고를 반드시 둔다.
11. 업무상 민감한 내용이 외부 공개 API로 전송될 수 있음을 관리자 설정에서 명확히 표시한다.
12. 정식 운영 전까지는 public API provider를 prototype 용도로만 사용한다.

---

## 2. 번역 Provider 전략

### 2-1. Provider 타입

기존 Plan 19의 Provider Adapter 구조를 다음처럼 확장한다.

```ts
type TranslationProvider =
  | 'DISABLED'
  | 'MANUAL_ONLY'
  | 'MYMEMORY_PUBLIC_NO_KEY'
  | 'LIBRETRANSLATE_PUBLIC_NO_KEY'
  | 'LIBRETRANSLATE_SELF_HOSTED'
  | 'LOCAL_PROXY'
  | 'GOOGLE_CLOUD_TRANSLATION';
```

### 2-2. 프로토타입 기본 Provider 우선순위

정식 운영 전 테스트 기준의 기본 우선순위는 다음이다.

```text
1순위: MYMEMORY_PUBLIC_NO_KEY
- 인증키 없이 테스트 가능한 공개 번역 API provider로 우선 연결.
- 짧은 업무카드 제목/설명 번역 테스트에 적합.
- quota 초과 또는 장애 발생 시 다음 provider로 fallback.

2순위: LIBRETRANSLATE_PUBLIC_NO_KEY
- 공개 mirror 중 API Key가 필요 없는 endpoint만 후보로 사용.
- mirror마다 안정성, 속도, API Key 요구 여부가 다르므로 자동 검증 필요.
- CORS 또는 rate limit 문제가 있으면 비활성화.

3순위: MANUAL_ONLY
- 자동번역 실패 시 수동 번역 입력으로 fallback.
- 프로토타입 검수와 JSON 구조 검증을 계속 진행할 수 있게 함.

4순위: LOCAL_PROXY / LIBRETRANSLATE_SELF_HOSTED
- 사내망 또는 로컬 환경에서 자체 번역 서버를 띄울 수 있을 때 사용.
- 정식 운영 전 안정성을 높이고 싶을 때 사용.

5순위: GOOGLE_CLOUD_TRANSLATION
- 사용자가 키와 결제/쿼터 설정을 준비한 경우에만 사용.
- GitHub Pages 정적 환경에서는 직접 key 노출 방식 금지.
```

### 2-3. Provider Health Check

번역 Provider를 설정할 때 다음 health check를 먼저 실행한다.

```ts
type TranslationProviderHealth = {
  provider: TranslationProvider;
  endpoint?: string;
  requiresApiKey: boolean;
  corsOk: boolean;
  koToViOk: boolean;
  viToKoOk: boolean;
  quotaWarning?: string;
  lastCheckedAt: string;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'LIMITED' | 'UNKNOWN';
};
```

Health check 문장:

```text
ko → vi: 안녕하세요. 업무 일정을 확인해 주세요.
vi → ko: Xin chào. Vui lòng kiểm tra lịch công việc.
```

Health check가 실패하면 해당 Provider를 기본값으로 설정하지 않는다.

---

## 3. 무료 공개 API 사용 정책

### 3-1. MyMemory Public No-Key Adapter

`MYMEMORY_PUBLIC_NO_KEY`는 인증키 없이 호출 가능한 공개 provider로 구현한다.

필수 구현 원칙:

```text
- 짧은 텍스트 단위로만 호출한다.
- 긴 업무 설명은 문단 단위로 분할하고, rate limit을 고려한다.
- 자동 retry는 1회 이하로 제한한다.
- quota 초과 시 사용자에게 “무료 번역 한도 초과 / 수동 번역 필요”를 표시한다.
- 동일 텍스트 재번역을 피하기 위해 translationCache를 둔다.
- 원문 hash 기준으로 캐시한다.
- 업무상 민감 정보가 외부 API로 전송될 수 있음을 관리자 설정에 표시한다.
```

예상 adapter 인터페이스:

```ts
async function translateWithMyMemory(input: TranslationInput): Promise<TranslationResult> {
  // langpair: ko|vi 또는 vi|ko
  // q: 원문
  // de: 선택값. 사용자가 관리자 설정에서 제공한 contact email이 있을 때만 사용.
}
```

주의:

```text
- 이메일이 없어도 anonymous 호출은 가능하되 한도가 낮을 수 있다.
- 사용자가 contact email을 설정하면 de parameter에 넣을 수 있다.
- email도 개인정보이므로 JSON export와 Git commit에 포함할지 여부를 분리해야 한다.
```

### 3-2. LibreTranslate Public No-Key Adapter

`LIBRETRANSLATE_PUBLIC_NO_KEY`는 공개 mirror 중 API Key가 필요 없는 endpoint만 사용한다.

필수 구현 원칙:

```text
- mirror URL 목록은 코드에 하드코딩하지 말고 설정값으로 관리한다.
- 기본 후보는 관리자 설정 화면에서 입력/수정 가능하게 한다.
- endpoint별 health check 후 AVAILABLE인 항목만 사용한다.
- 일부 LibreTranslate instance는 API Key를 요구하므로 requiresApiKey=true이면 public no-key provider에서 제외한다.
- self-hosted LibreTranslate는 `LIBRETRANSLATE_SELF_HOSTED`로 분리한다.
```

### 3-3. 비공식 Google Translate 금지

다음 방식은 사용하지 않는다.

```text
- translate.googleapis.com 비공식 호출 우회
- 웹페이지 DOM 크롤링 기반 번역
- 브라우저 자동화로 Google Translate 결과 가져오기
- 샘플 API Key, 공개 GitHub API Key 사용
```

Google Cloud Translation을 사용할 경우에는 반드시 사용자가 제공한 인증정보와 안전한 proxy 구조를 통해서만 연결한다.

---

## 4. 다국어 데이터 모델

### 4-1. 언어 코드

```ts
type LanguageCode = 'ko' | 'vi' | 'en';

type WorkspaceLanguage = 'ko' | 'vi';
```

### 4-2. 번역 상태

```ts
type TranslationStatus =
  | 'NONE'
  | 'NEEDS_TRANSLATION'
  | 'AUTO_TRANSLATED'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'HUMAN_APPROVED'
  | 'TRANSLATION_FAILED'
  | 'SKIPPED_BY_USER'
  | 'PROVIDER_LIMIT_EXCEEDED';
```

### 4-3. 공통 다국어 텍스트 구조

```ts
type MultiLangText = {
  originalLanguage: LanguageCode;
  originalText: string;
  translations: Partial<Record<LanguageCode, {
    text: string;
    status: TranslationStatus;
    provider?: TranslationProvider;
    translatedAt?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    sourceHash?: string;
    errorMessage?: string;
  }>>;
};
```

### 4-4. TaskCard 확장

기존 업무카드 필드를 삭제하지 말고 다음을 추가한다.

```ts
type TaskCardTranslationFields = {
  titleI18n?: MultiLangText;
  descriptionI18n?: MultiLangText;
  workScopeI18n?: MultiLangText;
  memoI18n?: MultiLangText;
  translationReviewStatus?: TranslationStatus;
};
```

### 4-5. Project 확장

```ts
type ProjectTranslationFields = {
  projectNameI18n?: MultiLangText;
  clientRequestI18n?: MultiLangText;
  internalMemoI18n?: MultiLangText;
};
```

### 4-6. ApprovalRequest / Notification / AuditLog 확장

결재, 알림, 로그는 원문 보존이 중요하다.

```text
- ApprovalRequest의 사유/반려사유/승인 메모도 번역 가능하게 한다.
- Notification은 짧은 문구이므로 UI 언어에 따라 label template을 먼저 번역하고, 업무카드 제목만 i18n 필드를 참조한다.
- AuditLog는 법적/운영 증빙 성격이 있으므로 원문을 절대 삭제하지 않는다.
```

---

## 5. 언어 감지 규칙

### 5-1. 자동 감지 우선순위

```text
1. 사용자가 명시적으로 입력 언어를 선택한 경우 그 값을 우선한다.
2. 한글 음절/자모가 포함되어 있으면 ko로 판단한다.
3. 베트남어 특수문자/성조가 포함되어 있으면 vi로 판단한다.
4. 라틴 문자만 있고 성조가 없으면 UNKNOWN으로 처리하고 사용자에게 선택하게 한다.
5. 숫자, 코드, 프로젝트 번호만 있으면 번역하지 않는다.
```

### 5-2. 감지 결과 UX

업무카드 입력창 하단에 다음처럼 표시한다.

```text
입력 언어: 한국어 감지됨 · 베트남어 자동번역 예정
입력 언어: Tiếng Việt 감지됨 · 한국어 자동번역 예정
입력 언어 확인 필요 · [한국어] [Tiếng Việt]
```

---

## 6. UI/UX 표시 전략

### 6-1. 핵심 판단

Workspace의 주 작성자는 CON-COST 한국 직원이고, VIET_QS 직원은 번역된 내용을 읽고 작업할 가능성이 높다. 따라서 한국어가 원문인 경우 다음 구조가 가장 가독성이 좋다.

```text
카드형 보드에서는 한국어 원문을 1차 정보로 유지한다.
베트남어는 2차 정보로 작게, 한 줄 요약 또는 펼침 형태로 표시한다.
베트남어 UI 모드에서는 베트남어 번역을 1차 정보로 올리고, 한국어 원문은 보조 정보로 내린다.
```

즉, **사용자의 현재 UI 언어를 1차 표시 언어로 하고, 원문 언어는 보조 표시**하는 구조가 최적이다.

### 6-2. 보드 카드 Compact View

카드가 길어지면 보드 전체 가독성이 떨어지므로 Compact View는 다음 규칙을 따른다.

```text
[상단] 프로젝트명 / 업무명 — 현재 UI 언어 기준 1차 표시
[중단] 원문 언어 badge + 원문 1줄 또는 번역 1줄
[하단] 담당자, 일정, 상태, 번역상태 badge
```

예시 — 한국어 UI 모드:

```text
[업무명] 102동 슬라브 수량 검토
[VI 자동번역] Kiểm tra khối lượng sàn tòa 102
담당: Nguyen Van A · 07/12~07/15 · 자동번역 검토필요
```

예시 — 베트남어 UI 모드:

```text
[Tên công việc] Kiểm tra khối lượng sàn tòa 102
[KO 원문] 102동 슬라브 수량 검토
Phụ trách: Nguyen Van A · 12/07~15/07 · Cần kiểm tra bản dịch
```

### 6-3. 카드 상세 Drawer / Modal

상세 화면은 탭 또는 2단 구조로 제공한다.

```text
Desktop 권장:
┌───────────────────────────────┐
│ 원문 KO                         │
│ 102동 슬라브 수량 검토           │
├───────────────────────────────┤
│ 번역 VI                         │
│ Kiểm tra khối lượng sàn tòa 102 │
└───────────────────────────────┘

Mobile 권장:
[원문 보기] [번역 보기] [둘 다]
```

Desktop에서는 side-by-side 또는 stacked card를 사용하고, Mobile에서는 탭 전환을 기본으로 한다.

### 6-4. 번역 상태 Badge

```text
번역없음: 회색 · 번역 필요
자동번역: 파란색 · Auto
검토필요: 노란색 · 검토필요
검수완료: 초록색 · 승인번역
실패: 빨간색 · 번역실패
한도초과: 주황색 · 무료한도초과
```

### 6-5. 한국어/베트남어 병기 기준

```text
짧은 제목: 항상 병기 가능
긴 설명: 기본 접힘, “번역 보기” 버튼으로 펼침
메모/코멘트: 작성자 언어 우선 + 번역 보기
결재 사유: 원문 우선 + 번역 병기
AuditLog: 원문 고정 + 필요 시 번역 보기
```

---

## 7. UI 언어 전환

### 7-1. 전역 언어 토글

상단 헤더 또는 설정 화면에 다음 토글을 추가한다.

```text
언어: KOR | VIET
```

또는 베트남어 UI에서는 다음처럼 표시한다.

```text
Ngôn ngữ: KOR | VIET
```

### 7-2. 라벨 번역 범위

최소 번역 대상:

```text
- Sidebar 메뉴
- Dashboard 카드 제목
- Project Board 탭/컬럼
- Intake 탭/버튼/폼 label
- Approval 상태 label
- Notification label
- Settings label
- Translation 설정 label
```

### 7-3. 라벨 번역 방식

UI label은 외부 API에 매번 보내지 말고 정적 dictionary로 관리한다.

```ts
const messages = {
  ko: {
    dashboard: '대시보드',
    projectBoard: '프로젝트 보드',
    preWork: '착수 전',
    inProgress: '진행 중',
    completed: '완료',
    revision: '수정',
  },
  vi: {
    dashboard: 'Bảng điều khiển',
    projectBoard: 'Bảng dự án',
    preWork: 'Chưa bắt đầu',
    inProgress: 'Đang thực hiện',
    completed: 'Hoàn thành',
    revision: 'Chỉnh sửa',
  },
};
```

주의:

```text
- 시스템 UI label은 정적 번역 사전.
- 사용자가 작성한 업무카드/프로젝트/메모는 Translation Provider.
```

---

## 8. Translation Cache / 비용·한도 방어

무료 API는 한도가 낮을 수 있으므로 캐시가 필수다.

```ts
type TranslationCacheItem = {
  sourceHash: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  sourceText: string;
  translatedText: string;
  provider: TranslationProvider;
  status: TranslationStatus;
  createdAt: string;
  expiresAt?: string;
};
```

캐시 정책:

```text
- 동일 원문+대상언어+provider 조합은 재호출하지 않는다.
- 원문 수정 시 hash가 바뀌므로 재번역 필요 상태로 전환한다.
- 자동번역 실패 결과는 짧은 시간만 캐시한다.
- 수동 검수 완료 번역은 provider 변경에도 유지한다.
```

---

## 9. JSON Handoff 확장

JSON export/import에 다음 데이터를 포함한다.

```text
- workspaceLanguage
- translationSettings
- translationProviderHealth
- translationCache
- TaskCard i18n fields
- Project i18n fields
- ApprovalRequest i18n fields
- Notification i18n fields
- Human review metadata
```

주의:

```text
- API Key는 JSON export에 포함하지 않는다.
- contact email도 기본 export에서는 제외한다.
- export 옵션에서 “운영 설정 포함”을 선택한 경우에만 비민감 설정을 포함한다.
- provider endpoint URL은 포함 가능하지만, Secret은 포함 금지.
```

---

## 10. Phase 진행 계획

Plan 19는 Phase 146~156으로 진행한다.  
각 Phase 완료 후 반드시 다음 항목을 보고하고 사용자 승인을 받아야 한다.

```text
- 작업 범위
- 수정 파일 목록
- 실제 화면 확인 결과
- lint/build/test 결과
- 남은 리스크
- 다음 Phase 진행 승인 요청
```

---

# Phase 146 — 현재 다국어/문구/스토어 구조 조사

## 목표

현재 Workspace 코드에서 다국어 적용 대상과 번역 적용 대상을 분리 조사한다.

## 작업

1. 전체 route 목록 확인.
2. Sidebar, Header, Dashboard, Projects, Intake, Approvals, Tasks, Notifications, Settings의 고정 문구 조사.
3. Project/TaskCard/ApprovalRequest/Notification/AuditLog store 구조 확인.
4. JSON export/import 구조 확인.
5. 현재 업무카드 입력 필드 목록 확인.
6. 번역 대상 필드와 번역 제외 필드 분류.

## 금지

```text
- 코드 수정 금지.
- 번역 provider 연결 금지.
- UI label 번역 적용 금지.
```

## 완료 보고

```text
[Phase 146 보고]
1. route별 고정 문구 목록
2. 사용자 입력 번역 대상 필드
3. 번역 제외 필드
4. 다국어 적용 위험 지점
5. Phase 147 진행 승인 요청
```

---

# Phase 147 — i18n 데이터 모델 및 번역 설정 설계

## 목표

기존 데이터 구조를 깨지 않고 i18n 필드와 번역 설정을 설계한다.

## 작업

1. `LanguageCode`, `WorkspaceLanguage`, `MultiLangText`, `TranslationStatus` 타입 추가 설계.
2. `TranslationProvider` 타입 확장.
3. `translationSettings` store 설계.
4. `translationCache` 구조 설계.
5. JSON Handoff 확장 설계.
6. API Key 미포함 정책 명시.

## 금지

```text
- 실제 번역 API 호출 금지.
- UI 변경 최소화.
```

## 완료 보고

```text
[Phase 147 보고]
1. 추가/변경 타입 목록
2. 기존 store와 충돌 여부
3. JSON export/import 확장안
4. Secret 제외 정책
5. Phase 148 진행 승인 요청
```

---

# Phase 148 — UI 언어 전환 KOR/VIET 토글 및 정적 Dictionary 적용

## 목표

Workspace UI 고정 문구를 KOR/VIET로 전환할 수 있게 한다.

## 작업

1. 상단 Header 또는 Settings에 `KOR | VIET` 토글 추가.
2. `uiLanguageStore` 또는 기존 uiStore 확장.
3. Sidebar, Header, Dashboard 주요 label부터 적용.
4. Project Board 컬럼 label 적용.
5. Intake 탭 label 적용.
6. Settings/Translation 메뉴 label 적용.

## 주의

```text
- 업무카드 사용자 입력값은 아직 자동번역하지 않는다.
- 정적 UI label만 dictionary 방식으로 번역한다.
```

## 완료 보고

```text
[Phase 148 보고]
1. 적용된 UI label 범위
2. KOR/VIET 전환 화면 증빙
3. 누락된 label 목록
4. Phase 149 진행 승인 요청
```

---

# Phase 149 — Free Public Translation Provider Adapter 구현

## 목표

정식 API Key 없이 테스트 가능한 공개 무료 번역 provider adapter를 구현한다.

## 작업

1. `translationProviderAdapter` 폴더 또는 module 생성.
2. `MYMEMORY_PUBLIC_NO_KEY` adapter 구현.
3. `LIBRETRANSLATE_PUBLIC_NO_KEY` adapter 구현.
4. Provider health check 함수 구현.
5. timeout, retry, quota error, provider fallback 처리.
6. translationCache 기본 구조 연결.
7. 외부 API 전송 동의/경고 UI 문구 준비.

## 금지

```text
- 웹에서 API Key 검색/수집 금지.
- 타인의 공개 API Key 사용 금지.
- 비공식 Google Translate 우회 금지.
- API Key를 코드에 하드코딩 금지.
```

## 완료 조건

```text
- MyMemory public no-key health check 가능.
- LibreTranslate public no-key endpoint 후보 입력 후 health check 가능.
- 실패 시 MANUAL_ONLY fallback 가능.
- Provider 상태가 UI 또는 설정에서 확인 가능.
```

## 완료 보고

```text
[Phase 149 보고]
1. 구현 provider 목록
2. health check 결과
3. 실패/fallback 처리 방식
4. 외부 전송 경고 표시 여부
5. Phase 150 진행 승인 요청
```

---

# Phase 150 — 업무카드 양방향 자동 번역 UI 구현

## 목표

업무카드 작성 시 한국어→베트남어, 베트남어→한국어 번역을 생성한다.

## 작업

1. 업무카드 입력폼에 입력 언어 감지 표시 추가.
2. `한국어 감지 → VI 번역 예정` 처리.
3. `베트남어 감지 → KO 번역 예정` 처리.
4. 자동 감지 불명확 시 언어 선택 버튼 제공.
5. `자동번역` 버튼 추가.
6. `번역 다시 생성` 버튼 추가.
7. 자동번역 결과를 원문과 분리 저장.
8. 번역 실패/한도초과 상태 표시.

## 완료 조건

```text
- 한국어 업무카드 제목 입력 시 베트남어 번역 필드 생성.
- 베트남어 업무카드 제목 입력 시 한국어 번역 필드 생성.
- 자동번역 실패 시 원문이 보존됨.
- 원문 수정 시 기존 번역은 검토필요 상태로 변경.
```

## 완료 보고

```text
[Phase 150 보고]
1. 번역 적용 필드
2. KO→VI 테스트 결과
3. VI→KO 테스트 결과
4. 원문 보존 검증 결과
5. Phase 151 진행 승인 요청
```

---

# Phase 151 — 보드 카드 / 상세 패널 이중언어 표시 UX 적용

## 목표

한국어와 베트남어를 카드에서 보기 좋게 표시한다.

## 작업

1. Board Card Compact View에 현재 UI 언어 기준 1차 표시 적용.
2. 보조 언어는 1줄 축약 표시.
3. 번역 상태 badge 적용.
4. 상세 Drawer/Modal에서 원문/번역/둘 다 보기 제공.
5. Desktop은 side-by-side 또는 stacked card.
6. Mobile은 tab 구조.
7. 긴 설명은 기본 접힘 처리.

## 완료 조건

```text
- 카드가 과도하게 길어지지 않는다.
- 한국 직원은 한국어 원문 중심으로 볼 수 있다.
- 베트남 직원은 베트남어 번역 중심으로 볼 수 있다.
- 원문 확인이 항상 가능하다.
```

## 완료 보고

```text
[Phase 151 보고]
1. 보드 카드 표시 방식
2. 상세 화면 표시 방식
3. 모바일 표시 방식
4. 가독성 리스크
5. Phase 152 진행 승인 요청
```

---

# Phase 152 — 번역 검수 및 승인 워크플로우

## 목표

자동번역 결과를 사람이 검수하고 승인할 수 있게 한다.

## 작업

1. `HUMAN_REVIEW_REQUIRED` 상태 표시.
2. PM/관리자/권한자만 번역 승인 가능하게 권한 적용.
3. `번역 승인` 버튼 추가.
4. `번역 수정 후 승인` 기능 추가.
5. 번역 승인 시 reviewedBy/reviewedAt 저장.
6. AuditLog 기록.
7. Notification 생성 여부 검토.

## 완료 보고

```text
[Phase 152 보고]
1. 번역 검수 권한
2. 승인/수정 flow
3. AuditLog 기록 결과
4. Phase 153 진행 승인 요청
```

---

# Phase 153 — 용어집 Glossary / 업무 용어 정규화

## 목표

구조/적산/업무 용어의 번역 일관성을 높인다.

## 작업

1. 기본 용어집 store 추가.
2. 한국어↔베트남어 용어 매핑 추가.
3. 예시 용어:
   - 수량산출
   - 구조도면
   - 슬라브
   - 벽체
   - 보
   - 기둥
   - 검토
   - 수정
   - 납품
   - 작업 착수 전
4. 번역 전 glossary pre-process 또는 번역 후 replace 정책 설계.
5. JSON export/import 포함.

## 완료 보고

```text
[Phase 153 보고]
1. 용어집 구조
2. 기본 용어 목록
3. 번역 결과에 미치는 영향
4. Phase 154 진행 승인 요청
```

---

# Phase 154 — JSON Handoff 다국어 데이터 반영

## 목표

번역 데이터가 JSON export/import에 안전하게 포함되도록 한다.

## 작업

1. JSON export에 i18n fields 포함.
2. translationCache 포함 여부 옵션화.
3. API Key, Secret, contact email 제외.
4. import preview에서 번역 데이터 미리보기.
5. import validation에서 i18n 구조 검증.
6. 깨진 번역 데이터 fallback 처리.

## 완료 보고

```text
[Phase 154 보고]
1. export 포함 필드
2. 제외 필드
3. import validation 결과
4. Phase 155 진행 승인 요청
```

---

# Phase 155 — 보안·비용·성능·권한 QA Matrix

## 목표

무료 공개 번역 API 사용 리스크를 QA Matrix로 검증한다.

## 검증 항목

```text
1. 외부 API 전송 경고가 표시되는가?
2. Secret이 Git에 커밋되지 않는가?
3. API Key 없이 public no-key provider만 사용하는가?
4. quota 초과 시 UI가 멈추지 않는가?
5. 번역 실패 시 원문이 보존되는가?
6. 원문과 번역문이 분리 저장되는가?
7. 권한 없는 사용자가 번역 승인할 수 없는가?
8. JSON export에 Secret이 포함되지 않는가?
9. 동일 문장 재번역이 cache로 방지되는가?
10. 한국어/베트남어 UI 전환 시 화면이 깨지지 않는가?
```

## 완료 보고

```text
[Phase 155 보고]
1. QA Matrix 결과
2. 실패 항목
3. 수정 필요 항목
4. Phase 156 진행 승인 요청
```

---

# Phase 156 — 최종 리포트, Plan 19 증빙, Push 승인 대기

## 목표

Plan 19 작업 결과를 보수적으로 정리하고 사용자 승인 후에만 push한다.

## 작업

1. `workspace_plan19_implementation_report.md` 작성.
2. 구현 완료/부분 구현/검증 필요/추후 확장 구분.
3. 실제 테스트 결과 작성.
4. provider별 health check 결과 작성.
5. lint/build/test 결과 작성.
6. 수정 파일 목록 작성.
7. 미해결 리스크 작성.
8. 사용자에게 원격 push 승인 요청.

## 금지

```text
- 사용자 승인 없이 remote push 금지.
- 검증하지 않은 provider를 “정상 동작”으로 표기 금지.
- public API를 정식 운영 안정화 완료로 표기 금지.
```

---

## 11. Antigravity 실행용 시작 프롬프트

아래 문장을 Antigravity에 그대로 전달한다.

```text
현재 F:\workspace 프로젝트의 Plan 19 작업을 시작한다.

중요 전제:
- Plan 단계는 뒤로 갈수록 최신 요구사항이 우선이다.
- Plan 19는 KOR/VIET 다국어 전환, 업무카드 양방향 자동 번역, 무료 공개 번역 API 우선 연결, 이중언어 UI/검수 workflow를 추가하는 Plan이다.
- 정식 운영 전 프로토타입 단계이므로 API Key가 필요 없는 공개 무료 번역 provider를 우선 사용한다.
- 단, 인터넷에서 임의의 API Key를 검색·수집·하드코딩하지 마라.
- MyMemory public no-key, LibreTranslate public no-key/self-hosted 같은 공식 공개 provider adapter 방식으로 구현한다.
- 업무카드 한국어 입력 시 베트남어 번역, 베트남어 입력 시 한국어 번역이 생성되도록 한다.
- 원문과 번역문을 절대 덮어쓰지 말고 분리 저장한다.
- 자동번역은 검수 전까지 공식 원문으로 취급하지 않는다.
- 한국어/베트남어 병기 UI는 카드 가독성을 해치지 않도록 현재 UI 언어 1차 표시 + 원문/번역 보조 표시 구조로 설계한다.
- 사용자 승인 없이 다음 Phase로 넘어가지 마라.
- 사용자 승인 없이 GitHub 원격 push하지 마라.

먼저 Phase 146만 진행한다.
코드 수정, 번역 API 연결, UI 변경은 하지 말고 현재 구조 조사 보고서만 작성하라.
```

