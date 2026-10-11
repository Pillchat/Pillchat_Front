# 맞춤형 정보 설정

`/mypage`의 맞춤형 정보 설정은 `/onboarding`에서 회원가입과 같은 항목을 편집합니다. 기존 `/onboarding/student`, `/onboarding/professional`, 각 단계 주소도 같은 설정 화면을 표시합니다. OAuth 회원가입의 `/onboarding/oauth`는 별도 가입 흐름을 유지합니다.

| 입력 필드                | 필수 여부                               | 백엔드 User 저장 필드 |
| ------------------------ | --------------------------------------- | --------------------- |
| 실명 `realName`          | 필수, 1~50자                            | `username`            |
| 닉네임 `nickname`        | 필수, 한글/영문/숫자 2~50자             | `nickname`            |
| 학년/상태 `grade`        | 필수, 회원가입의 9개 선택지             | `grade`               |
| 학교 `university`        | 선택, 최대 255자, 비우면 빈 문자열 저장 | `school`              |
| 가입 경로 `signupSource` | 필수, 회원가입의 8개 선택지             | `signupSource`        |

선택지는 `constants/signup.ts`를 재사용합니다. 기존 회원의 학년이나 가입 경로가 없거나 현재 선택지와 다르면 빈 선택 상태로 표시하며, 저장 전에 선택해야 합니다.

## API

프론트의 `GET /api/profile/personal-info`, `PUT /api/profile/personal-info`는 인증 정보를 포함하여 백엔드의 동일한 경로를 호출합니다. 요청과 응답은 위의 다섯 필드를 사용합니다. 저장 응답에서 모든 값이 일치하는지 확인한 후 성공을 표시하고 닉네임·학교·학년의 프론트 상태를 갱신합니다.

연결된 `Yakchat_Server`의 `ProfileController`, `ProfileService`, `PersonalInfoDto`에 조회·수정 처리가 추가되었습니다. 프론트와 백엔드 변경을 함께 반영해야 합니다. 기존 닉네임/이미지 편집 API는 그대로 사용합니다.

백엔드는 회원가입의 `SignupPolicy`를 재사용하고, 검증과 닉네임 중복 확인을 완료한 후 한 트랜잭션에서 값을 수정합니다. 프로필 이미지, 계정 등급 `UserGrade`, 이전 온보딩 학습 정보는 변경하지 않습니다. 일반 프로필의 `studentGrade` 표시에는 현재 회원가입 학년을 우선 사용하고, 학년이 없는 이전 회원은 기존 `StudentProfile.grade`를 사용합니다.

## 검증

- 프론트: `node --test tests/personal-info.test.mjs` — 입력 경계, 선택값, 학교 생략, 인증 요청 전달, 오류 상태 보존.
- 백엔드: `gradlew.bat test --tests "*PersonalInfo*"` — 다섯 필드 저장, 닉네임 충돌, 기존 데이터 보존, 학년 표시, HTTP 계약.
- 브라우저: 별도의 메모리 테스트 서버를 연결하여 변경·저장·재조회, 필수값 검사, 저장 중 알약 UI, 모바일 레이아웃을 확인합니다. 실제 사용자 데이터는 검증에 사용하지 않습니다.

이번 로컬 검증은 프론트 테스트 40개와 백엔드 테스트 14개를 통과했습니다. 백엔드는 설치된 Java 21·Gradle 8.5를 이용한 임시 복사본에서 `--release 17`로 컴파일하여 검증했으며, 적용된 다섯 서버 파일과 테스트한 소스가 일치함을 확인했습니다. 원본 서버의 Java 17·Gradle 8.11.1 빌드 설정은 변경하지 않았습니다.
