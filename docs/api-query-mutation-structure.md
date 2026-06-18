# API Query Mutation Structure

API hook은 서버 상태를 읽는 작업과 변경하는 작업으로 나눈다.

## Folder Rule

```text
hooks/queries
  GET 기반 데이터 조회 hook

hooks/mutations
  POST, PUT, DELETE 기반 서버 상태 변경 hook
```

## Placement Rule

- 서버 데이터를 읽으면 `hooks/queries`
- 서버 데이터를 만들거나 수정하거나 삭제하면 `hooks/mutations`
- app, components에서는 `useQuery`, `useMutation`을 직접 호출하지 않는다
- 기존 화면에서 쓰는 wrapper hook은 유지할 수 있다
- wrapper hook 내부 구현은 queries 또는 mutations를 사용한다

## Current Shared Query Hooks

- `useAnswersQuery`
- `useAnswerQuery`
- `useBoardsQuery`
- `useBoardQuery`
- `useBoardCommentsQuery`
- `useSubjectsQuery`
- `useSubjectQuery`
- `useFilesQuery`
- `useLikeStatusQuery`
- `useMaterialsQuery`
- `useMaterialQuery`
- `useQuestionsQuery`

## Current Shared Mutation Hooks

- `useAcceptAnswerMutation`
- `useCreateBoardCommentMutation`
- `useDeleteAnswerMutation`
- `useDeleteBoardMutation`
- `useDeleteBoardCommentMutation`
- `useDeleteMaterialMutation`
- `useDeleteQuestionMutation`
- `useSaveAnswerMutation`
- `useSaveOnboardingMutation`
- `useSaveQuestionMutation`
- `useToggleBoardCommentLikeMutation`
- `useToggleLikeMutation`
- `useUpdateBoardCommentMutation`

## Compatibility Wrappers

아래 hook들은 기존 import를 깨지 않기 위해 유지한다.

- `useSubjects`
- `useFetchImage`
- `useLikeStatus`
- `useAnswerAccept`

## Changed Layout

기존

- app, components, 일부 wrapper hook 안에서 `useQuery`, `useMutation`을 직접 선언
- 파일 조회, 좋아요, 질문, 답변, 게시글, 자료 조회가 화면 파일 안에 섞여 있음
- 삭제, 댓글, 온보딩 저장 mutation이 화면 파일 안에 섞여 있음

변경

- `useSubjects`는 `useSubjectsQuery`를 사용
- `useFetchImage`는 `useFilesQuery`를 사용
- `useLikeStatus`는 `useLikeStatusQuery`와 `useToggleLikeMutation`을 사용
- `useAnswerAccept`는 `useAcceptAnswerMutation`을 사용
- 질문, 답변, 게시글, 자료 조회는 `hooks/queries`의 도메인 query hook을 사용
- 삭제, 댓글, 저장 mutation은 `hooks/mutations`의 도메인 mutation hook을 사용
- app, components에는 query 결과 처리, 화면 상태, 이동 처리만 남긴다

새 API hook을 만들 때는 wrapper보다 `hooks/queries` 또는 `hooks/mutations`에 먼저 추가한다.
