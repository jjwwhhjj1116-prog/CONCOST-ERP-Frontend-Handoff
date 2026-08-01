# File Upload Lifecycle Contract v1.0

Status: `FROZEN_V1`

## A. ERP Business Attachments

Backend Storage Adapter가 Upload Intent, resumable upload, finalize, malware scan, permission, version, checksum, audit와 short-lived download URL을 제공한다. Storage provider와 scanner 제품은 OpenAPI에 고정하지 않는다.

## B. Google Shared Drive

Drive 카테고리와 승인된 프로젝트 자료실은 별도 Google Drive Integration Contract를 사용한다. Google account, Shared Drive, folder, membership, sharing과 revocation을 별도로 정의한다.

## Lifecycle

| State | Owner | Meaning |
|---|---|---|
| `LOCAL_SELECTED` | Frontend | 로컬에서 선택됨; 서버 업로드 아님 |
| `UPLOAD_INTENT_CREATED` | Server | 업로드 권한과 대상 발급 |
| `UPLOADING` | Frontend | binary 전송 중 |
| `UPLOADED` | Server | binary 수신 확인 |
| `SCANNING` | Server | checksum/MIME/malware 검사 |
| `READY` | Server | 업무 command에 첨부 가능 |
| `QUARANTINED` | Server | 다운로드·제출 차단 |
| `FAILED` | Server | 재시도 또는 지원 필요 |
| `DELETED` | Server | 보존정책에 따른 삭제 상태 |

파일 선택 또는 metadata 저장만으로 `READY`를 표시하지 않는다.

## Dynamic Capabilities

`GET /api/v1/system/capabilities`는 `defaultMaxFileSize`, `moduleMaxFileSize`, `batchMaxSize`, `allowedMimeTypes`, `allowedExtensions`, `resumableUploadThreshold`, `scanRequired`, `storageReady`를 반환한다. Frontend는 크기·형식을 하드코딩하지 않는다.

초기 UI 제안은 일반 문서·이미지 100MB/file, CAD·ZIP·대형 프로젝트·음성·영상·클레임 녹음 2GB/file이다. 이 값은 서버 capability가 없을 때 업로드를 허용하는 fallback이 아니며 최종 제한은 Backend/보안 정책이 결정한다.

## Security

MIME sniffing, filename normalization, extension allowlist, checksum, malware scan, quarantine, company/resource permission, URL expiry, version, audit를 적용한다. `QUARANTINED`는 다운로드·제출할 수 없다. Binary와 signed URL은 browser persistence에 저장하지 않는다.

## Scanner Handoff

Viet QS Backend팀과 보안담당자가 scanner, timeout, retry, quarantine, 감염파일 보존·폐기, 관리자 확인, audit와 최대 지원크기를 제안한다.
