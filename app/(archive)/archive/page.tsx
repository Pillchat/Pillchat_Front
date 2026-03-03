// "use client";

// import { FC, useEffect, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import {
//   GeneralHeader,
//   BottomNavbar,
//   TabsWithUnderline,
// } from "@/components/molecules";
// import { useArchiveTabState } from "@/app/(archive)/archive/_hooks/useArchiveTabState";
// import { useMyQuestions } from "./_hooks/useMyQuestion";
// import { useMyAnswers } from "./_hooks/useMyAnswers";

// const TABS = [
//   { value: "my-questions", label: "내가 올린 질문" },
//   { value: "my-answers", label: "내가 답한 질문" },
// ];

// const ArchivePage: FC = () => {
//   const { currentStatus, handleTabChange } = useArchiveTabState();
//   const router = useRouter();

//   const token =
//     typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

//   const {
//     data: myQuestions,
//     loading: questionsLoading,
//     error: questionsError,
//     refetch: refetchQuestions,
//   } = useMyQuestions(token || undefined);

//   const {
//     data: myAnswers,
//     loading: answersLoading,
//     error: answersError,
//     refetch: refetchAnswers,
//   } = useMyAnswers(token || undefined);

//   useEffect(() => {
//   console.log("🟡 myAnswers raw data:", myAnswers);
// }, [myAnswers]);

//   // ---------- 디버그: 데이터 형태 콘솔 출력 ----------
//   useEffect(() => {
//     if (myQuestions) {
//       console.info("📥 myQuestions (length):", myQuestions.length);
//       console.info("📥 myQuestions sample:", myQuestions[0]);
//     } else {
//       console.info("📥 myQuestions: null or undefined");
//     }
//   }, [myQuestions]);

//   useEffect(() => {
//     if (myAnswers) {
//       console.info("📥 myAnswers (length):", myAnswers.length);
//       console.info("📥 myAnswers sample:", myAnswers[0]);
//     } else {
//       console.info("📥 myAnswers: null or undefined");
//     }
//   }, [myAnswers]);
//   // ---------------------------------------------------

//   // 안전한 questionId 추출 헬퍼
//   const pickQuestionId = (item: any): number | null => {
//     // 여러 가능한 형태를 순서대로 확인
//     return (
//       (item && (item.question?.id ?? item.questionId ?? item.id)) ??
//       null
//     );
//   };

//   // 디버그 UI 출력 여부 (응답이 예상 형태가 아니면 true로)
//   const showDebugQuestions =
//     Array.isArray(myQuestions) && myQuestions.length > 0 && typeof myQuestions[0] !== "object";
//   const showDebugAnswers =
//     Array.isArray(myAnswers) && myAnswers.length > 0 && typeof myAnswers[0] !== "object";

//   return (
//     <div className="flex h-screen flex-col">
//       {/* 상단 헤더 */}
//       <div className="flex-shrink-0">
//         <GeneralHeader />
//         <TabsWithUnderline
//           className="mx-6"
//           tabs={TABS}
//           defaultValue={currentStatus}
//           onValueChange={handleTabChange}
//         />
//       </div>

//       {/* 본문 */}
//       <div className="flex-1 overflow-y-auto px-6 py-4">
//         {/* 내가 올린 질문 */}
//         {currentStatus === "my-questions" ? (
//           <div>
//             {questionsLoading ? (
//               <p className="text-gray-500 text-center">불러오는 중...</p>
//             ) : questionsError ? (
//               <p className="text-red-500 text-center">{questionsError}</p>
//             ) : myQuestions && myQuestions.length > 0 ? (
//               <ul className="space-y-3">
//                 {myQuestions.map((q: any) => (
//                   <li
//                     key={q.id ?? q.questionId ?? q.question?.id ?? Math.random()}
//                     className="border rounded-lg p-3 shadow-sm hover:shadow transition cursor-pointer"
//                     onClick={() => {
//                       const qid = pickQuestionId(q);
//                       if (qid) router.push(`/question/${qid}`);
//                       else alert("질문 ID를 찾을 수 없습니다. 콘솔을 확인하세요.");
//                     }}
//                   >
//                     <h3 className="font-semibold text-base">
//                       {q.title ?? q.question?.title ?? "제목 없음"}
//                     </h3>
//                     <p className="text-sm text-gray-600 mt-1 line-clamp-2">
//                       {q.content ?? q.question?.content ?? "내용 없음"}
//                     </p>
//                     <p className="text-xs text-gray-400 mt-1">
//                       {q.createdAt
//                         ? new Date(q.createdAt).toLocaleDateString("ko-KR")
//                         : q.question?.createdAt
//                         ? new Date(q.question.createdAt).toLocaleDateString("ko-KR")
//                         : ""}
//                     </p>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-gray-500 text-center">
//                 아직 올린 질문이 없습니다.
//               </p>
//             )}

//             {/* 새로고침 */}
//             <div className="text-center mt-6">
//               <button
//                 onClick={refetchQuestions}
//                 className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 transition"
//               >
//                 새로고침
//               </button>
//             </div>

//             {/* 디버그: 예상치 못한 형태일 때 원본 출력 */}
//             {showDebugQuestions && (
//               <pre className="mt-4 bg-gray-50 p-3 rounded text-xs overflow-auto">
//                 {JSON.stringify(myQuestions, null, 2)}
//               </pre>
//             )}
//           </div>
//         ) : (
//           // 내가 답한 질문
//           <div>
//             {answersLoading ? (
//               <p className="text-gray-500 text-center">불러오는 중...</p>
//             ) : answersError ? (
//               <p className="text-red-500 text-center">{answersError}</p>
//             ) : myAnswers && myAnswers.length > 0 ? (
//               <ul className="space-y-3">
//                 {myAnswers.map((a: any) => {
//                   const qid = pickQuestionId(a);
//                   return (
//                     <li
//                       key={a.id ?? qid ?? Math.random()}
//                       className="border rounded-lg p-3 shadow-sm hover:shadow transition cursor-pointer"
//                       onClick={() => {
//                         if (qid) router.push(`/question/${qid}`);
//                         else alert("질문 ID를 찾을 수 없습니다. 콘솔을 확인하세요.");
//                       }}
//                     >
//                       <h3 className="font-semibold text-base">
//                         {a.question?.title ?? a.title ?? "제목 없음"}
//                       </h3>
//                       <p className="text-sm text-gray-600 mt-1 line-clamp-2">
//                         {a.answerContent ?? a.content ?? a.question?.content ?? "내용 없음"}
//                       </p>
//                       <p className="text-xs text-gray-400 mt-1">
//                         {a.createdAt
//                           ? new Date(a.createdAt).toLocaleDateString("ko-KR")
//                           : ""}
//                       </p>
//                     </li>
//                   );
//                 })}
//               </ul>
//             ) : (
//               <p className="text-gray-500 text-center">
//                 아직 답변한 질문이 없습니다.
//               </p>
//             )}

//             {/* 새로고침 */}
//             <div className="text-center mt-6">
//               <button
//                 onClick={refetchAnswers}
//                 className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 transition"
//               >
//                 새로고침
//               </button>
//             </div>

//             {/* 디버그: 원본 출력 (예상치 못한 형태일 때) */}
//             {showDebugAnswers && (
//               <pre className="mt-4 bg-gray-50 p-3 rounded text-xs overflow-auto">
//                 {JSON.stringify(myAnswers, null, 2)}
//               </pre>
//             )}
//           </div>
//         )}
//       </div>

//       {/* 하단 네비게이션 */}
//       <div className="flex-shrink-0">
//         <BottomNavbar />
//       </div>
//     </div>
//   );
// };

// export default ArchivePage;

"use client";

import { FC, Fragment, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GeneralHeader,
  BottomNavbar,
  TabsWithUnderline,
  QuestionListCard,
} from "@/components/molecules";
import { useArchiveTabState } from "@/app/(archive)/archive/_hooks/useArchiveTabState";
import { useMyQuestions } from "./_hooks/useMyQuestion";
import { useMyAnswers } from "./_hooks/useMyAnswers";
import { Separator } from "@/components/ui/separator";
import { formatDiffDate } from "@/lib/functions";
import { map } from "lodash";

const TABS = [
  { value: "my-questions", label: "내가 올린 질문" },
  { value: "my-answers", label: "내가 답한 질문" },
];

const ArchivePage: FC = () => {
  const { currentStatus, handleTabChange } = useArchiveTabState();
  const router = useRouter();

  // ✅ 로컬 스토리지에서 토큰 가져오기
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // ✅ 내가 올린 질문
  const {
    data: myQuestions,
    loading: questionsLoading,
    error: questionsError,
    refetch: refetchQuestions,
  } = useMyQuestions(token || undefined);

  // ✅ 내가 답한 질문
  const {
    data: myAnswers,
    loading: answersLoading,
    error: answersError,
    refetch: refetchAnswers,
  } = useMyAnswers(token || undefined);

  // ✅ 안전한 questionId 추출 헬퍼
  const pickQuestionId = (item: any): number | null => {
    return item?.question?.id ?? item?.questionId ?? item?.id ?? null;
  };

  // ✅ 공통 렌더링 함수
  const renderQuestionList = (list: any[] | undefined | null) => {
    if (!list || list.length === 0) {
      return (
        <div className="flex h-full items-center justify-center pb-[5.625rem]">
          <div className="text-border">
            {currentStatus === "my-questions"
              ? "아직 올린 질문이 없습니다."
              : "아직 답변한 질문이 없습니다."}
          </div>
        </div>
      );
    }

    return (
      <div className="mx-6 py-5 pb-[5.625rem]">
        <div className="flex flex-col gap-5">
          {map(list, (item) => {
            const qid = pickQuestionId(item);
            const question = {
              id: String(qid ?? ""), // ✅ id를 string으로 변환
              title: item?.title ?? item?.question?.title ?? "제목 없음",
              content:
                item?.content ??
                item?.answerContent ??
                item?.question?.content ??
                "내용 없음",
              createdAt: formatDiffDate(
                item?.createdAt ??
                  item?.question?.createdAt ??
                  new Date().toISOString(),
              ),
              likeCount: item?.likeCount ?? 0,
              answerCount: item?.answerCount ?? 0,
              subjectName: item?.subjectName ?? item?.question?.subjectName,
              viewCount: item?.viewCount ?? 0,
              userNickname:
                item?.userNickname ?? item?.question?.userNickname ?? "익명",

              // ✅ 추가: 이미지 필드 매핑
              images: item?.images ?? item?.question?.images ?? [],
            };

            return (
              <Fragment key={qid ?? Math.random()}>
                <QuestionListCard
                  question={question}
                  onClick={() => {
                    if (qid) router.push(`/question/${qid}`);
                    else alert("질문 ID를 찾을 수 없습니다.");
                  }}
                />
                <Separator className="last:hidden" />
              </Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col">
      {/* ✅ 상단 헤더 */}
      <div className="flex-shrink-0">
        <GeneralHeader />
        <TabsWithUnderline
          className="mx-6"
          tabs={TABS}
          defaultValue={currentStatus}
          onValueChange={handleTabChange}
        />
      </div>

      {/* ✅ 본문 */}
      <div className="relative flex-1 overflow-y-auto">
        {currentStatus === "my-questions" ? (
          questionsLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-border">불러오는 중...</div>
            </div>
          ) : questionsError ? (
            <div className="flex h-full items-center justify-center text-red-500">
              {questionsError}
            </div>
          ) : (
            renderQuestionList(myQuestions)
          )
        ) : answersLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-border">불러오는 중...</div>
          </div>
        ) : answersError ? (
          <div className="flex h-full items-center justify-center text-red-500">
            {answersError}
          </div>
        ) : (
          renderQuestionList(myAnswers)
        )}
      </div>

      {/* ✅ 새로고침 버튼 */}
      <div className="mt-4 text-center">
        <button
          onClick={
            currentStatus === "my-questions" ? refetchQuestions : refetchAnswers
          }
          className="rounded-lg border px-4 py-2 text-sm transition hover:bg-gray-100"
        >
          새로고침
        </button>
      </div>

      {/* ✅ 하단 네비게이션 */}
      <div className="flex-shrink-0">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default ArchivePage;
