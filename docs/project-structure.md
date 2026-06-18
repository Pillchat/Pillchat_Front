# 디렉토리 구조 규칙

이 문서는 Yakchat Front의 디렉토리 배치 기준과 최근 구조 변경 내용을 설명합니다. 새 파일을 추가하거나 기존 파일을 옮길 때는 아래 기준을 먼저 확인해주세요.

## 한 줄 원칙

```text
한 route에서만 쓰는 코드는 route 옆에 둔다.
여러 route에서 재사용하는 코드는 root 공유 폴더에 둔다.
```

Next.js App Router에서는 `app` 내부 폴더가 URL 구조를 만들지만, `_components`, `_hooks`처럼 `_`로 시작하는 private folder는 라우팅 대상이 아닙니다. 그래서 route 전용 구현을 page 옆에 안전하게 둘 수 있습니다.

## 현재 구조

```text
app/
  (auth)/
    signup/
      page.tsx
      _components/       signup 전용 UI
      _hooks/            signup 전용 hooks
    onboarding/
      _components/       onboarding route들에서만 쓰는 UI
  (board)/
    board/[id]/
      page.tsx
      _components/       게시글 상세 전용 UI
    materials/[id]/
      page.tsx
      _components/       학습자료 상세 전용 UI
  (qna)/
    answer/[id]/
      page.tsx
      _components/       답변 작성 전용 UI
      _hooks/            답변 작성 전용 hooks
    question/[id]/
      page.tsx
      _components/       질문 상세 전용 UI
  api/                   Next route handlers
  styles/                global CSS

components/
  ui/                    shadcn/Radix 기반 primitive
  atoms/                 여러 화면에서 쓰는 작은 공통 UI
  molecules/             여러 화면에서 쓰는 조합형 공통 UI
  icons/                 React icon component

hooks/                   여러 route에서 쓰는 client hook
  queries/               GET 기반 server-state hook
  mutations/             POST, PUT, DELETE 기반 server-state hook
lib/
  client/                browser/localStorage/FormData 의존 helper
  server/                Next route handler 전용 server helper
  shared/                server/client 양쪽에서 안전한 순수 helper
store/                   app-wide Jotai state
  onboarding/            onboarding Jotai state
constants/               공통 상수
validations/             공통 validation rule
types/                   API/domain type
public/
  brand/                 로고/브랜드 SVG
  icons/                 UI icon SVG
  illustrations/         화면용 일러스트 SVG
  fonts/                 font asset
docs/                    개발 문서
```

## 파일 배치 기준

| 파일 성격                                | 위치                        | 예시                                           |
| ---------------------------------------- | --------------------------- | ---------------------------------------------- |
| 특정 page 또는 route에서만 쓰는 컴포넌트 | `app/<route>/_components`   | `BoardDetailPage`, `AnswerForm`                |
| 특정 page 또는 route에서만 쓰는 hook     | `app/<route>/_hooks`        | `useAnswerForm`, `usePostForm`                 |
| 여러 route에서 재사용하는 작은 UI        | `components/atoms`          | `LikeButton`, `TextButton`                     |
| 여러 route에서 재사용하는 조합 UI        | `components/molecules`      | `CustomHeader`, `BottomNavbar`                 |
| shadcn/Radix primitive                   | `components/ui`             | `button`, `dialog`, `textarea`                 |
| React 컴포넌트 형태의 아이콘             | `components/icons`          | `QuestionWithBubble`                           |
| 여러 route에서 쓰는 hook                 | `hooks`                     | `useSubjects`, `useAuth`                       |
| 브라우저/localStorage 기반 helper        | `lib/client`                | `fetchAPI`, `getCurrentUserId`, `uploadBoard`  |
| Next route handler 전용 helper           | `lib/server`                | `serverFetch`, `proxyToBackend`                |
| 순수 공통 helper                         | `lib/shared`                | `formatDiffDate`, `buildQueryParams`           |
| route handler                            | `app/api/<domain>/route.ts` | `app/api/questions/route.ts`                   |
| 공유 type                                | `types`                     | `question.ts`, `wrongnote.ts`                  |
| 공유 validation                          | `validations`               | `email.ts`, `password.ts`                      |
| Jotai state                              | `store`                     | `profile.ts`, `quizSession.ts`, `onboarding/*` |
| URL로 참조하는 SVG/PNG/font              | `public/<asset-type>`       | `/brand/PillChat.svg`, `/icons/Bell.svg`       |

## 변경 전후 요약

이전에는 `components/organisms`에 화면 전용 컴포넌트가 모여 있었습니다. 이 폴더는 “공통 UI”처럼 보였지만 실제로는 특정 route의 data fetching, mutation, navigation에 강하게 묶여 있었습니다.

```text
변경 전
components/
  organisms/
    answer/
    board/
    material/
    onboarding/
    question/
    CameraPage.tsx
    VerifyInputField.tsx

변경 후
components/
  atoms/
  molecules/
  ui/
  icons/

app/
  ...각 route...
    _components/
```

### public asset 변경

```text
public/PillChat.svg
  -> public/brand/PillChat.svg

public/Bell.svg
  -> public/icons/Bell.svg

public/Student.svg
  -> public/illustrations/Student.svg

public/fonts/PretendardVariable.woff2
  -> public/fonts/PretendardVariable.woff2
```

URL 참조도 같은 기준으로 바뀌었습니다.

```text
/PillChat.svg
  -> /brand/PillChat.svg

/Bell.svg
  -> /icons/Bell.svg

/Student.svg
  -> /illustrations/Student.svg
```

## 상세 이동 맵

### Q&A 질문 상세

```text
components/organisms/question/QuestionDetailPage.tsx
  -> app/(qna)/question/[id]/_components/QuestionDetailPage.tsx

components/organisms/question/QuestionTitleSection.tsx
  -> app/(qna)/question/[id]/_components/QuestionTitleSection.tsx

components/organisms/question/QuestionContents.tsx
  -> app/(qna)/question/[id]/_components/QuestionContents.tsx

components/organisms/answer/AnswerDetailPage.tsx
  -> app/(qna)/question/[id]/_components/AnswerDetailPage.tsx
```

이유: 질문 상세 화면에서만 사용되며, 질문 상세의 query, like, answer list 렌더링과 결합되어 있습니다.

### Q&A 답변 작성

```text
components/organisms/answer/AnswerForm.tsx
  -> app/(qna)/answer/[id]/_components/AnswerForm.tsx

components/organisms/answer/ViewQuestion.tsx
  -> app/(qna)/answer/[id]/_components/ViewQuestion.tsx
```

이유: `/answer/[id]` 작성/수정 화면과 `useAnswerForm` hook에 직접 연결되어 있습니다.

### 게시판 상세

```text
components/organisms/board/BoardDetailPage.tsx
  -> app/(board)/board/[id]/_components/BoardDetailPage.tsx

components/organisms/board/BoardTitleSection.tsx
  -> app/(board)/board/[id]/_components/BoardTitleSection.tsx

components/organisms/board/BoardContents.tsx
  -> app/(board)/board/[id]/_components/BoardContents.tsx
```

이유: 게시글 상세, 파일 표시, 댓글 작성/수정/삭제, 댓글 좋아요 등 `/board/[id]`에만 필요한 상태와 mutation을 포함합니다.

### 학습자료 상세

```text
components/organisms/material/MaterialDetailPage.tsx
  -> app/(board)/materials/[id]/_components/MaterialDetailPage.tsx

components/organisms/material/MaterialTitleSection.tsx
  -> app/(board)/materials/[id]/_components/MaterialTitleSection.tsx

components/organisms/material/MaterialContents.tsx
  -> app/(board)/materials/[id]/_components/MaterialContents.tsx
```

이유: 학습자료 상세 route의 파일 key 변환, PDF/image 표시, 수정/삭제/신고 흐름에 결합되어 있습니다.

### 온보딩

```text
components/organisms/onboarding/SelectSubject.tsx
  -> app/(auth)/onboarding/_components/SelectSubject.tsx

components/organisms/onboarding/SelectPersonalInfo.tsx
  -> app/(auth)/onboarding/_components/SelectPersonalInfo.tsx

components/organisms/onboarding/SelectAnswerFrequency.tsx
  -> app/(auth)/onboarding/_components/SelectAnswerFrequency.tsx

components/organisms/onboarding/SelectSubjectByGrade.tsx
  -> app/(auth)/onboarding/_components/SelectSubjectByGrade.tsx

components/organisms/onboarding/OnboardingComplete.tsx
  -> app/(auth)/onboarding/_components/OnboardingComplete.tsx
```

이유: 온보딩 route 그룹에서만 사용하는 step UI입니다. `app/(auth)/onboarding/[role]/page.tsx`와 `app/(auth)/onboarding/[role]/[step]/page.tsx`가 같은 구현을 공유하므로 `onboarding/_components`에 모았습니다.

### 회원가입

```text
components/organisms/VerifyInputField.tsx
  -> app/(auth)/signup/_components/VerifyInputField.tsx

components/organisms/CameraPage.tsx
  -> app/(auth)/signup/_components/CameraPage.tsx
```

이유: signup flow 또는 signup hook과 직접 연결된 UI입니다. 특히 `CameraPage`는 signup OCR upload hook에 의존하므로 전역 컴포넌트로 두지 않습니다.

### Jotai state와 상수

```text
lib/atoms/onboarding/*
  -> store/onboarding/*

lib/atoms/RTM.ts
  -> constants/reportTypes.ts
```

이유: Jotai atom은 `store` 아래로 모으고, atom이 아닌 신고 타입 맵은 `constants`로 분리했습니다.

보존한 파일:

```text
store/S3auth.ts
store/ocrVerifyAtom.ts
```

두 파일은 현재 제거하지 않습니다. 실제 사용 여부와 제거 가능성은 별도 검토 후 결정합니다.

### lib helper 경계

```text
lib/functions/fetchData.ts
  -> lib/client/fetch.ts

lib/functions/jwt.ts
  -> lib/client/auth.ts

lib/functions/multipartApi.ts
  -> lib/client/upload.ts

lib/functions/boardView.ts
  -> lib/client/boardView.ts

lib/functions/nativeCamera.ts
  -> lib/client/nativeCamera.ts

lib/functions/serverFetch.ts
  -> lib/server/fetch.ts

lib/functions/serverProxyMultipart.ts
  -> lib/server/proxyMultipart.ts

lib/functions/date.ts
  -> lib/shared/date.ts

lib/functions/buildQueryParams.ts
  -> lib/shared/query.ts

lib/functions/syncViewCount.ts
  -> lib/shared/syncViewCount.ts
```

이유: `fetchAPI`처럼 `localStorage`를 쓰는 코드는 client 전용이고, `serverFetch`처럼 `NextRequest`와 backend proxy에 묶인 코드는 server 전용입니다. 같은 barrel에서 가져오면 server/client 경계가 흐려지므로 역할별 import로 분리했습니다.

## import 규칙

route 전용 컴포넌트는 가능한 상대 경로로 가져옵니다.

```ts
import { BoardDetailPage } from "./_components/BoardDetailPage";
```

공통 UI와 공통 helper는 alias를 사용합니다.

```ts
import { LikeButton } from "@/components/atoms";
import { CustomHeader } from "@/components/molecules";
import { fetchAPI } from "@/lib/client/fetch";
import { serverFetch } from "@/lib/server/fetch";
import { formatDiffDate } from "@/lib/shared/date";
```

## 새 파일을 만들 때 판단 순서

1. 이 파일이 한 route에서만 쓰이는가?
   - 예: `app/<route>/_components` 또는 `app/<route>/_hooks`
2. 같은 route group의 여러 page에서만 쓰이는가?
   - 예: `app/(auth)/onboarding/_components`
3. 서로 다른 route group에서 재사용되는가?
   - 예: `components`, `hooks`, `lib`, `types`
4. URL로 직접 참조되는 asset인가?
   - 예: `public/brand`, `public/icons`, `public/illustrations`

## 남겨둔 정리 과제

- `store/S3auth.ts`와 `store/ocrVerifyAtom.ts`는 보존했습니다. 제거 여부는 실제 사용처와 기능 흐름을 별도 검토한 뒤 결정합니다.
- `public/icons` 안에는 현재 사용하지 않는 create-next-app 기본 SVG도 포함되어 있을 수 있습니다. 사용 여부 확인 후 제거할 수 있습니다.
- `lib/client/auth.ts`는 JWT decode와 localStorage 기반 사용자 조회가 함께 있습니다. 추후 순수 JWT decode만 `lib/shared`로 더 잘게 분리할 수 있습니다.

## 참고한 외부 기준

- [Next.js project structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js colocation and private folders](https://nextjs.org/docs/app/getting-started/project-structure#colocation)
- [shadcn/ui components.json](https://ui.shadcn.com/docs/components-json)
- [Supabase Next.js example](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs#supabase-utilities)
