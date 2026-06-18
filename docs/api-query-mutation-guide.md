# API Query Mutation 분리 규칙

이 문서는 서버 상태 API를 `queries`와 `mutations`로 나눈 이유와 현재 코드 작성 규칙을 설명한다.

## 1. 기존 방식에 대한 설명

기존에는 API 호출이 화면 파일, 공통 hook, 일부 wrapper hook 안에 직접 작성되어 있었다.

예시

- `app` 페이지에서 `useQuery`를 직접 선언
- `components` 안에서 `useMutation`을 직접 선언
- `useSubjects`, `useFetchImage`, `useLikeStatus`, `useAnswerAccept` 안에서 `fetchAPI`와 React Query 로직을 직접 작성
- 질문, 답변, 게시글, 학습자료, 파일 조회 로직이 화면 코드 안에 섞여 있음
- 삭제, 댓글 작성, 좋아요, 온보딩 저장 같은 변경 요청도 화면 코드 안에 섞여 있음

기존 방식의 문제점

- API 요청 위치를 찾기 어려움
- 같은 API 호출 패턴이 여러 파일에 반복됨
- query key와 invalidate 기준이 파일마다 달라질 수 있음
- 화면 코드가 데이터 요청, 화면 상태, 라우팅, alert를 모두 담당하게 됨
- 새로운 개발자가 GET 요청과 변경 요청의 위치를 예측하기 어려움
- API 로직을 수정할 때 영향 범위를 파악하기 어려움

## 2. 개선한 이유

서버 상태를 읽는 작업과 서버 상태를 변경하는 작업은 성격이 다르다.

읽기 작업

- 캐싱이 중요함
- query key 관리가 중요함
- loading, error, refetch 기준이 중요함
- 같은 데이터를 여러 화면에서 재사용할 가능성이 큼

변경 작업

- 성공 후 invalidate가 중요함
- 낙관적 업데이트가 필요할 수 있음
- POST, PUT, DELETE 요청의 payload 관리가 중요함
- 성공 후 화면 이동, alert, 입력값 초기화 같은 후처리가 붙음

따라서 API hook을 역할별로 분리했다.

- 읽기 API는 `hooks/queries`
- 변경 API는 `hooks/mutations`
- 화면 파일은 데이터 사용과 화면 흐름만 담당

이렇게 분리하면 API 위치가 예측 가능해지고, query key와 mutation 동작을 한 곳에서 관리할 수 있다.

## 3. 현재 방식에 대한 설명

현재 서버 상태 API hook은 아래 구조를 따른다.

```text
hooks
  queries
    GET 기반 서버 상태 조회 hook

  mutations
    POST, PUT, DELETE 기반 서버 상태 변경 hook
```

현재 query hook 예시

- `useSubjectsQuery`
- `useSubjectQuery`
- `useQuestionsQuery`
- `useQuestionQuery`
- `useAnswersQuery`
- `useAnswerQuery`
- `useBoardsQuery`
- `useBoardQuery`
- `useBoardCommentsQuery`
- `useMaterialsQuery`
- `useMaterialQuery`
- `useFilesQuery`
- `useLikeStatusQuery`

현재 mutation hook 예시

- `useSaveQuestionMutation`
- `useSaveAnswerMutation`
- `useAcceptAnswerMutation`
- `useToggleLikeMutation`
- `useDeleteQuestionMutation`
- `useDeleteAnswerMutation`
- `useDeleteBoardMutation`
- `useDeleteMaterialMutation`
- `useCreateBoardCommentMutation`
- `useUpdateBoardCommentMutation`
- `useDeleteBoardCommentMutation`
- `useToggleBoardCommentLikeMutation`
- `useSaveOnboardingMutation`

기존 wrapper hook은 import 변경을 줄이기 위해 유지한다.

- `useSubjects`
- `useFetchImage`
- `useLikeStatus`
- `useAnswerAccept`

wrapper hook 내부는 직접 `fetchAPI`를 작성하지 않고 `queries` 또는 `mutations` hook을 사용한다.

## 4. 분류 기준

### hooks/queries에 두는 경우

서버 데이터를 읽는 API는 `hooks/queries`에 둔다.

대상

- GET 요청
- 목록 조회
- 상세 조회
- 파일 URL 조회
- 좋아요 상태 조회
- 과목 조회
- 댓글 목록 조회

예시

```text
GET /api/questions
useQuestionsQuery

GET /api/questions/{id}
useQuestionQuery

GET /api/files
useFilesQuery
```

### hooks/mutations에 두는 경우

서버 데이터를 만들거나 수정하거나 삭제하는 API는 `hooks/mutations`에 둔다.

대상

- POST 요청
- PUT 요청
- PATCH 요청
- DELETE 요청
- 좋아요 토글
- 답변 채택
- 댓글 작성, 수정, 삭제
- 온보딩 저장

예시

```text
POST /api/questions
useSaveQuestionMutation

PUT /api/answers/{id}
useSaveAnswerMutation

DELETE /api/boards/{id}
useDeleteBoardMutation
```

### 화면 파일에 남겨도 되는 경우

모든 `fetch` 호출을 무조건 query 또는 mutation hook으로 옮기지는 않는다.

아래처럼 서버 상태 캐싱보다 즉시 실행 흐름이 중요한 경우는 화면 또는 전용 util에 남길 수 있다.

- 파일 업로드용 presigned URL 요청과 실제 S3 업로드
- PDF 업로드 후 폴링
- 브라우저 API와 강하게 묶인 요청
- 로그인, 회원가입처럼 별도 form submit 흐름이 강한 요청

단, 같은 요청이 여러 화면에서 반복되면 query 또는 mutation hook으로 승격한다.

## 5. 관련 코드 규칙 설명

### 기본 규칙

- `app`, `components`, `store`에서는 `useQuery`와 `useMutation`을 직접 호출하지 않는다.
- React Query hook은 `hooks/queries` 또는 `hooks/mutations` 안에서만 선언한다.
- API 요청 함수는 hook 파일 안에서 함께 export할 수 있다.
- 화면 파일은 hook을 호출하고 결과를 사용한다.
- 화면 파일은 alert, router 이동, modal 상태, input 초기화 같은 UI 흐름을 담당한다.

### query hook 작성 규칙

query hook은 아래 형식을 따른다.

```ts
export const questionQueryKey = (questionId?: string | null) =>
  ["question", questionId] as const;

export const getQuestion = (questionId: string) => {
  return fetchAPI(`/api/questions/${questionId}`, "GET");
};

export const useQuestionQuery = (questionId?: string | null) => {
  return useQuery({
    queryKey: questionQueryKey(questionId),
    queryFn: () => getQuestion(questionId as string),
    enabled: Boolean(questionId),
  });
};
```

query hook 규칙

- query key 함수는 hook 파일 안에 함께 둔다.
- query key는 도메인 이름과 식별자를 포함한다.
- id가 필요한 조회는 `enabled: Boolean(id)`를 사용한다.
- API 응답 정규화가 필요하면 query hook 안에서 처리한다.
- 같은 데이터를 여러 곳에서 쓰면 같은 query key를 사용한다.

### mutation hook 작성 규칙

mutation hook은 아래 형식을 따른다.

```ts
type SaveQuestionPayload = {
  data: QuestionCreateRequest;
  questionId?: string | null;
};

export const saveQuestion = ({ data, questionId }: SaveQuestionPayload) => {
  if (questionId) {
    return fetchAPI(`/api/questions/${questionId}`, "PUT", data);
  }

  return fetchAPI("/api/questions", "POST", data);
};

export const useSaveQuestionMutation = (options?: UseMutationOptions) => {
  return useMutation({
    mutationFn: saveQuestion,
    ...options,
  });
};
```

mutation hook 규칙

- POST, PUT, DELETE 요청은 mutation hook으로 만든다.
- payload 타입을 hook 파일에 명확히 둔다.
- API 요청 함수와 hook을 함께 export한다.
- 공통 요청 로직은 mutation hook에 둔다.
- 성공 후 alert, router 이동, modal 닫기, form reset은 화면 파일에서 처리한다.
- invalidate는 화면 흐름과 가까운 경우 화면 파일에서 처리할 수 있다.
- 여러 화면에서 같은 invalidate가 반복되면 mutation hook 내부로 옮긴다.

### wrapper hook 규칙

기존 화면에서 이미 사용 중인 wrapper hook은 유지할 수 있다.

예시

```text
useSubjects
useFetchImage
useLikeStatus
useAnswerAccept
```

wrapper hook 규칙

- 기존 import를 깨지 않기 위해 유지한다.
- 내부 구현은 `queries` 또는 `mutations` hook을 사용한다.
- 새 API를 추가할 때는 wrapper보다 `hooks/queries` 또는 `hooks/mutations`에 먼저 추가한다.

### 파일 이름 규칙

query hook

- `useQuestionQuery`
- `useQuestionsQuery`
- `useBoardQuery`
- `useBoardsQuery`

mutation hook

- `useSaveQuestionMutation`
- `useDeleteQuestionMutation`
- `useToggleLikeMutation`
- `useCreateBoardCommentMutation`

이름 기준

- 단건 조회는 단수형
- 목록 조회는 복수형
- 생성, 수정 통합은 `Save`
- 삭제는 `Delete`
- 토글은 `Toggle`
- 댓글처럼 하위 도메인이 있으면 도메인 이름을 포함

### 새 API 추가 순서

1. 요청이 조회인지 변경인지 먼저 판단한다.
2. 조회면 `hooks/queries`에 hook을 만든다.
3. 변경이면 `hooks/mutations`에 hook을 만든다.
4. query key 또는 payload 타입을 함께 정의한다.
5. 화면 파일에서는 새 hook만 import해서 사용한다.
6. 기존 화면 동작이 있다면 alert, router 이동, invalidate는 유지한다.
7. `pnpm exec tsc --noEmit`으로 타입을 확인한다.
8. 필요하면 `npm run build`로 빌드를 확인한다.

## 정리

현재 API 구조는 서버 상태의 성격에 따라 위치를 나눈다.

- 읽기 API는 `hooks/queries`
- 변경 API는 `hooks/mutations`
- 화면 파일은 화면 흐름만 담당
- 기존 wrapper hook은 유지하되 내부 구현은 새 구조를 사용

이 규칙을 따르면 API 위치를 예측하기 쉽고, 중복 요청 로직을 줄일 수 있으며, query key와 mutation 흐름을 더 일관되게 관리할 수 있다.
