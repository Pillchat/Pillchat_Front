# 학생증 수동 인증

확정한 간단한 시안을 실제 학생 인증 요청과 관리자 심사 기능으로 연결했습니다.

## 진입 경로

- 마이페이지 → 정보 → 학생 인증: /student-verification
- 마이페이지 → 관리자 → 학생 인증 관리: /admin/student-verifications

학생 화면은 사진 첨부와 요청 버튼만 표시합니다. 이미지가 정상적으로 읽힌 뒤 요청 버튼을 활성화합니다. 요청 후에는 같은 사진과 승인 대기 상태를 표시하고, 승인 완료 계정의 중복 요청은 막습니다. 거부된 요청은 새 사진으로 다시 제출할 수 있습니다.

관리자는 대기 중인 요청의 이름, 올라온 날짜, 이미지, 거부·승인 버튼을 봅니다. 목록은 최신순이며 스크롤하면 다음 페이지를 불러옵니다. 이미지를 읽지 못하면 심사 버튼을 비활성화합니다. 성공한 심사는 대기 목록에서 사라집니다.

## API 계약

| 메서드 | 경로                                            | 계약                                                    |
| ------ | ----------------------------------------------- | ------------------------------------------------------- |
| POST   | /api/student-verifications/attachments          | multipart file 한 개 → fileId 문자열                    |
| POST   | /api/student-verifications                      | JSON fileId, idempotencyKey → Snapshot                  |
| GET    | /api/student-verifications/me                   | 본인의 최신 Snapshot, 없으면 빈 응답(null)              |
| GET    | /api/admin/student-verifications?page=0&size=20 | 대기 요청 Listing. size 1~50                            |
| PUT    | /api/admin/student-verifications/{id}/review    | JSON decision: APPROVED 또는 REJECTED → 저장한 Snapshot |

Snapshot은 id(문자열), userName, status(PENDING/APPROVED/REJECTED), submittedAt(Asia/Seoul), imageUrl(비공개 저장소의 만료되는 URL)을 포함합니다. Listing은 items, page, hasNext를 반환합니다.

등록은 로그인한 사용자를 소유자로 사용합니다. fileId가 본인의 STUDENT_ID 업로드인지 검사하고, 계정 행 잠금으로 동시 등록을 직렬화합니다. 같은 idempotencyKey와 fileId는 기존 결과를 반환합니다. 이미지 업로드가 끝난 뒤 등록 응답을 잃어도 같은 파일과 요청 키로 재시도합니다. 화면의 로그인 계정이 바뀌면 이전 사진과 선택 상태를 제거하고, 진행 중인 제출도 소유자가 달라졌는지 확인합니다.

관리자 경로는 서버에서 ROLE_ADMIN을 검사합니다. 심사 행을 잠그고 결정을 저장하며, 같은 결정의 재전송은 성공합니다. 반대 결정으로 이미 처리된 요청을 덮어쓰면 409입니다. reviewedBy와 reviewedAt을 저장합니다. 다른 사용자는 일반 파일 다운로드 API로도 이미지에 접근할 수 없습니다.

JPG·PNG·WebP 한 장, 10MB 이하만 허용하며 서버에서 확장자·MIME·파일 헤더를 검사합니다. 사진의 MIME 정보가 비어 있으면 공통 uploadContentType으로 파일명에서 형식을 확인하고, 같은 형식으로 multipart 파일을 전송합니다. 기존 FileUploadService의 비공개 저장·연결·미연결 파일 정리 정책을 재사용합니다. STUDENT_ID 파일은 일반 대용량 presigned PUT 경로를 통한 검증 우회를 금지합니다. API 응답은 no-store이며 이미지 URL은 서버에서 권한을 확인한 뒤 생성합니다.

승인 여부는 이 기능의 인증 상태에 저장합니다. 기존 학습·가입 자격이나 뱃지 지급 규칙을 새로 변경하지 않습니다.

## 배포 준비

백엔드 작업 위치: C:/Users/user/Documents/확인용/Yakchat_Server_home-dashboard

백엔드는 ddl-auto=validate를 사용하므로 배포 전에 다음 마이그레이션을 적용해야 합니다.

- docs/migrations/20261116_student_verification.sql

새 student_verification 테이블을 만들고, file_metadata.ref_type이 ENUM이면 STUDENT_ID를 기존 값 뒤에 추가합니다. 이미 적용한 경우 다시 실행해도 기존 요청을 변경하지 않습니다. 운영 DB에는 적용하지 않았습니다.

프론트·백엔드를 함께 반영한 뒤 일반 계정의 첨부·재로그인·재조회와 관리자 계정의 승인·거부를 확인합니다. 별도 환경 변수나 서비스 의존성은 추가하지 않았습니다.

## 확인

- 프론트: tests/student-verification.test.mjs 및 전체 Node 테스트.
- 백엔드: StudentVerificationServiceTest, StudentVerificationHttpTest. 통합 테스트는 실제 일회용 MySQL·Redis와 모의 S3를 사용합니다.
- 화면: design-previews/student-verification/check-implementation.cjs. 실행 중인 실제 Next 페이지와 모의 API를 사용하며 실제 개인정보를 전송하지 않습니다.
- 시각 비교와 최종 결과: 프로젝트 루트 design-qa.md.
