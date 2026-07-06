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
- studentId
- grade

일반 회원가입 선택값

- university
- department

변경 포인트

- documentType은 일반 회원가입에서 student만 허용합니다.
- university는 선택값입니다.
- grade는 필수값입니다.
- nickname은 일반 회원가입 요청 payload에 반드시 포함됩니다.
- 약사/전문가용 licenseNumber, issueDate는 일반 회원가입에서 더 이상 사용하지 않습니다.

---

## 3. 일반 회원가입 백엔드 주의사항

백엔드 일반 회원가입 API에서 다음 조건을 반영해야 합니다.

- documentType이 student가 아니면 거절
- studentId 필수
- grade 필수
- university는 없어도 가입 가능
- nickname 필수

학교명은 사용자가 입력하지 않을 수 있으므로 DB 컬럼이 NOT NULL이면 빈 문자열 허용 또는 nullable 처리가 필요합니다.

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

---

## 6. OAuth 관련 추가 주의사항

OAuth 참고 문서에 작성된 기본 흐름은 그대로 사용합니다.

다만 현재 프론트 구현상 추가로 확인해야 할 점이 있습니다.

### OAuth 온보딩의 가입 유형

현재 OAuth 온보딩 화면에는 아직 학생 / 전문가 선택 분기가 남아 있습니다.

즉 OAuth 최종 가입 요청에서는 documentType으로 다음 두 값이 올 수 있습니다.

- student
- professional

백엔드에서 OAuth 전문가 가입을 지원하지 않을 계획이라면 프론트에서도 OAuth 온보딩의 전문가 선택을 제거해야 합니다.

---

## 7. 일반 회원가입과 OAuth 온보딩의 필드 기준 차이

현재 일반 회원가입 기준

- studentId: 숫자 8~12자
- grade: 필수
- university: 선택

현재 OAuth 온보딩 기준

- studentId: 숫자 8~14자
- grade: 선택
- university: 필수

OAuth 온보딩은 기존 화면 재사용 영향으로 일반 회원가입과 일부 기준이 다릅니다.

백엔드 기준을 하나로 정하면 프론트도 통일하는 것이 좋습니다.

권장 기준

- studentId: 숫자 8~12자 또는 8~14자 중 하나로 통일
- grade: 필수
- university: 선택

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
- 학번 중복을 허용할지 여부

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
