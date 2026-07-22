# 기존 기능 변경사항 및 백엔드 추가 주의사항

작성자 : 진건희

이 문서는 OAuth 로그인 참고 문서에 이미 작성된 1차 확인 API, 신규/기존 유저 분기, OAuth 최종 가입 API 흐름과 겹치지 않는 추가 변경사항 및 백엔드 주의사항을 정리한 문서입니다.

---

## 1. 일반 회원가입 변경사항

기존 회원가입에서 학생 / 약사(전문가) 선택 단계가 제거되었습니다.

현재 일반 회원가입은 학생 회원가입만 지원합니다.

변경 전 흐름

- 회원가입 진입
- 학생 또는 약사 선택
- 선택한 유형에 따라 정보 입력
- 닉네임은 뒤쪽 별도 단계에서 입력

변경 후 흐름

- 회원가입 진입
- 학생 선택 단계 없이 바로 학생 정보 입력
- 닉네임을 학생 정보 입력 단계에서 함께 입력
- 약사/전문가 일반 회원가입 제거
- 비밀번호 입력 후 바로 회원가입 요청

---

## 2. 일반 회원가입 필드 변경사항

일반 회원가입 필수값

- nickname
- password
- email
- agreeToTerms: true
- realName
- documentType: student
- grade
- signupSource

일반 회원가입 선택값

- university

변경 포인트

- documentType은 일반 회원가입에서 student만 허용합니다.
- university는 선택값입니다.
- studentId와 department는 일반 회원가입에서 더 이상 수집하지 않습니다.
- grade는 필수값이며 `1학년`~`6학년`, `대학원생`, `약사`, `기타` 중 하나입니다.
- signupSource는 정의된 8개 가입 경로 중 하나여야 합니다.
- nickname은 일반 회원가입 요청 payload에 반드시 포함됩니다.
- 약사/전문가용 licenseNumber, issueDate는 일반 회원가입에서 더 이상 사용하지 않습니다.

---

## 3. 일반 회원가입 백엔드 주의사항

백엔드 일반 회원가입 API에서 다음 조건을 반영해야 합니다.

- documentType이 student가 아니면 거절
- studentId와 department 없이 가입 가능
- grade는 허용된 9개 학년/상태 값 중 하나여야 함
- signupSource는 허용된 8개 가입 경로 값 중 하나여야 함
- university는 없어도 가입 가능
- nickname 필수

학교명은 사용자가 입력하지 않을 수 있고 학번·학과는 더 이상 수집하지 않으므로 관련 DB 컬럼이 NOT NULL이면 빈 문자열 허용 또는 nullable 처리가 필요합니다.

---

## 4. 일반 회원가입 성공 응답 주의사항

프론트는 일반 회원가입 성공 후 자동 로그인 처리를 기대할 수 있습니다.

따라서 백엔드가 가입 성공과 동시에 로그인을 완료시키려면 다음 토큰을 응답해야 합니다.

- access_token
- refresh_token

만약 회원가입 후 로그인 페이지로 다시 보내는 정책이라면 프론트 처리 방식도 그에 맞춰 조정이 필요합니다.

---

## 5. 홍보 온보딩 추가사항

회원가입/로그인 앞단에 /intro 페이지가 추가되었습니다.

버튼 동작

- 가볍게 시작하기: /signup
- 이미 회원이에요: /login

/login에는 기존 일반 로그인과 Google/Kakao OAuth 로그인이 함께 존재합니다.

일반 회원가입 흐름

- 정보 입력
- 서비스 이용약관 동의
- 개인정보 처리방침 동의
- 가입 방법 선택
- Google/Kakao 선택: OAuth 인증 후 OAuth 가입 완료
- 이메일 선택: 이메일 인증, 비밀번호 설정 후 일반 가입 완료

---

## 6. OAuth 관련 추가 주의사항

OAuth 참고 문서에 작성된 기본 흐름은 그대로 사용합니다.

다만 현재 프론트 구현상 추가로 확인해야 할 점이 있습니다.

### OAuth 온보딩의 가입 유형

OAuth 온보딩도 일반 회원가입과 동일하게 학생 가입만 지원합니다.

- documentType: student
- 전문가 선택 및 전문가용 필드 제거

---

## 7. 일반 회원가입과 OAuth 온보딩의 공통 필드 기준

일반 회원가입과 OAuth 온보딩은 같은 정보 입력 화면과 필드 기준을 사용합니다.

- realName: 필수
- nickname: 필수
- documentType: student
- grade: 9개 학년/상태 값 중 하나로 필수
- university: 선택
- signupSource: 가입 경로 8개 값 중 하나로 필수
- studentId, department: 미수집

signupSource 허용값

- 친구/지인 추천
- 인스타그램
- 유튜브
- 블로그/카페
- 앱스토어 검색
- 광고
- 학교
- 기타

OAuth 최종 가입 API도 위 기준에 맞춰 studentId와 department 없이 가입할 수 있어야 합니다.

---

## 8. DB/연동 정책 주의사항

OAuth 기존 유저 판단은 프론트가 아니라 백엔드 DB 기준으로 해야 합니다.

권장 unique 기준

- provider + providerUserId

예시

- google + Google sub
- kakao + Kakao id

추가로 다음 정책을 확인해야 합니다.

- 같은 이메일이지만 provider가 다른 경우
- OAuth 가입 완료 전 oauth_signup_token이 만료된 경우
- 닉네임 중복인 경우

백엔드 확정 정책

- 같은 이메일로 기존 일반 회원가입 계정이 있으면 ALREADY_EXIST_EMAIL 에러를 반환합니다.
- 프론트는 ALREADY_EXIST_EMAIL을 받으면 기존 계정으로 로그인하라는 안내를 표시합니다.

---

## 9. oauth_signup_token 보안 주의사항

oauth_signup_token은 access token이 아니라 OAuth 신규 가입 완료를 위한 임시 토큰입니다.

백엔드에서 다음 처리를 권장합니다.

- 짧은 만료 시간 설정
- 1회 사용 후 폐기
- provider, providerUserId, email 등 OAuth 인증 결과와 서버에서 매핑
- 프론트에서 전달한 email/provider만 신뢰하지 않기
- 최종 가입 완료 시 해당 token으로 OAuth 인증 결과를 다시 확인

---

## 10. 백엔드 에러 응답 권장

프론트에서 사용자에게 명확히 안내할 수 있도록 상황별 메시지를 내려주는 것이 좋습니다.

권장 응답 형태

- success: false
- message: 상황별 에러 메시지

권장 케이스

- ALREADY_EXIST_EMAIL
- 닉네임 중복
- 학번 중복
- oauth_signup_token 만료
- oauth_signup_token 재사용
- 지원하지 않는 documentType
- OAuth provider 계정이 이미 다른 유저와 연결됨
