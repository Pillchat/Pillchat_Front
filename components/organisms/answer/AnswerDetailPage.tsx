// "use client";

// import {
//   ActionMenu,
//   ActionMenuItem,
//   SelectModal,
//   UserInfoField,
// } from "@/components/molecules";
// import { fetchAPI } from "@/lib/functions";
// import { useQuery } from "@tanstack/react-query";
// import { FC, useState, useEffect } from "react";
// import { AnswerListResponse, Answer } from "@/types/question";
// import { useFetchImage, useAnswerAccept } from "@/hooks";
// import { Image, LikeButton, TextButton } from "@/components/atoms";
// import { Button } from "@/components/ui/button";
// import { useRouter } from "next/navigation";

// // 개별 답변 컴포넌트
// const AnswerItem: FC<{
//   answer: Answer;
//   isAuthor: boolean;
//   questionId: string;
// }> = ({ answer, isAuthor, questionId }) => {
//   const router = useRouter();
//   const { imageData, imageLoading } = useFetchImage({
//     sourceKey: answer.author.avatarUrl,
//   });

//   const [selectAnswer, setSelectAnser] = useState(false);

//   const { acceptAnswer, isAccepting } = useAnswerAccept({
//     questionId,
//     onSuccess: () => {
//       setSelectAnser(false);
//       alert("답변이 채택되었습니다.");
//     },
//     onError: (error) => {
//       alert("답변 채택 중 오류가 발생했습니다.");
//     },
//   });

//   const authorWithImage = {
//     ...answer.author,
//     avatarUrl: imageData?.[0]?.preSignedUrl || answer.author.avatarUrl,
//   };

//   const menuItems: ActionMenuItem[] = answer.author.isMe
//     ? [
//         {
//           id: "edit",
//           label: "수정",
//           onClick: () => {
//             router.push(`/answer/${questionId}?edit=${answer.id}`);
//           },
//         },
//         {
//           id: "delete",
//           label: "삭제",
//           onClick: () => {
//             console.log("삭제");
//           },
//           variant: "destructive",
//         },
//       ]
//     : [
//         {
//           id: "report",
//           label: "신고",
//           onClick: () => {
//             console.log("신고");
//           },
//         },
//       ];

//   return (
//     <div className="mb-4 flex flex-col gap-3">
//       {answer.accepted && (
//         <div className="flex">
//           <TextButton
//             variant="outline"
//             label="채택된 답변"
//             className="pointer-events-none border-primary bg-accent text-primary"
//             size="sm"
//           />
//         </div>
//       )}
//       <UserInfoField author={authorWithImage} />
//       {/* 여기에 답변 내용 등 추가 컴포넌트들을 렌더링할 수 있습니다 */}
//       <div className="flex flex-col gap-3">
//         {answer.steps.map((step, index) => (
//           <div
//             className="flex flex-col gap-3 rounded-xl border p-4"
//             key={step.stepId}
//           >
//             <p className="text-xl font-semibold">STEP {index + 1}</p>
//             <div className="rounded-xl bg-secondary px-3 py-4 text-foreground">
//               <p className="whitespace-pre-wrap break-words">{step.content}</p>
//             </div>
//             <div>
//               {step.images.map((image) => (
//                 <Image src={image} alt={image} />
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>
//       <div className="flex items-center justify-between">
//         <LikeButton onClick={() => {}} likeCount={answer.likeCount} />
//         <ActionMenu
//           trigger={
//             <Button variant="ghost" size="icon" className="h-8 w-8">
//               <img src="/Ellipsis.svg" alt="더보기" className="h-5 w-5" />
//             </Button>
//           }
//           items={menuItems}
//           align="end"
//           side="top"
//           showBackdrop={true}
//         />
//       </div>
//       <div>
//         {isAuthor && !answer.accepted && (
//           <Button
//             variant="brand"
//             className="mt-3 w-full text-lg font-normal"
//             onClick={() => {
//               setSelectAnser(true);
//             }}
//             disabled={isAccepting}
//           >
//             {isAccepting ? "채택 중..." : "채택하기"}
//           </Button>
//         )}
//         {answer.accepted && (
//           <Button
//             variant="outline"
//             className="mt-3 w-full text-lg font-normal"
//             disabled
//           >
//             채택된 답변
//           </Button>
//         )}
//       </div>
//       {/* 답변 채택 모달 */}
//       <SelectModal
//         isOpen={selectAnswer}
//         onClose={() => setSelectAnser(false)}
//         onConfirm={() => {
//           acceptAnswer(answer.id.toString());
//         }}
//         title="채택하시겠습니까?"
//         message="채택이 진행되면 취소할 수 없으며, 다른 답변에 대한 채택에는 추가 팜머니가 발생합니다."
//       />
//     </div>
//   );
// };

// export const AnswerDetailPage: FC<{
//   questionId: string;
//   isAuthor: boolean;
// }> = ({ questionId, isAuthor }) => {
//   const [page, setPage] = useState(0);
//   const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
//   const pageSize = 5; // 한 번에 5개씩 로드

//   const {
//     data: answerData,
//     isLoading: answerLoading,
//     isFetching,
//   } = useQuery<AnswerListResponse>({
//     queryKey: ["answers", questionId, page],
//     queryFn: () =>
//       fetchAPI(
//         `/api/answers/cards?questionId=${questionId}&page=${page}&size=${pageSize}`,
//         "GET",
//       ),
//     enabled: !!questionId,
//   });

//   // 데이터가 로드되면 답변 목록 업데이트
//   useEffect(() => {
//     if (answerData?.items) {
//       if (page === 0) {
//         // 첫 페이지인 경우 새로 설정
//         setAllAnswers(answerData.items);
//       } else {
//         // 다음 페이지인 경우 기존 답변에 추가
//         setAllAnswers((prev) => [...prev, ...answerData.items]);
//       }
//     }
//   }, [answerData, page]);

//   const handleLoadMore = () => {
//     if (answerData?.hasNext && !isFetching) {
//       setPage((prev) => prev + 1);
//     }
//   };

//   if (answerLoading && page === 0) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div>
//       {/* 답변 목록 */}
//       {allAnswers.map((answer: Answer, index) => (
//         <div key={answer.id}>
//           <AnswerItem
//             answer={answer}
//             isAuthor={isAuthor}
//             questionId={questionId}
//           />
//           {index < allAnswers.length - 1 && (
//             <div className="-mx-6 border-t-[12px] border-t-[#F4F4F4] py-5" />
//           )}
//         </div>
//       ))}

//       {/* 답변 더보기 버튼 */}
//       {answerData?.hasNext && (
//         <div className="mt-6 flex justify-center">
//           <TextButton
//             label={isFetching ? "로딩 중..." : "답변 더보기"}
//             variant={isFetching ? "disabled" : "outline"}
//             onClick={handleLoadMore}
//             className="w-full text-lg font-normal"
//           />
//         </div>
//       )}
//     </div>
//   );
// };

"use client";

import {
  ActionMenu,
  ActionMenuItem,
  SelectModal,
  UserInfoField,
} from "@/components/molecules";
import { fetchAPI } from "@/lib/functions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FC, useState, useEffect } from "react";
import { AnswerListResponse, Answer } from "@/types/question";
import { useFetchImage, useAnswerAccept } from "@/hooks";
import { Image, LikeButton, TextButton } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// =====================
// 개별 답변 컴포넌트
// =====================
const AnswerItem: FC<{
  answer: Answer;
  isAuthor: boolean;
  questionId: string;
}> = ({ answer, isAuthor, questionId }) => {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const { imageData } = useFetchImage({
    sourceKey: answer.author.avatarUrl,
  });

  const [selectAnswer, setSelectAnser] = useState(false);

  const { acceptAnswer, isAccepting } = useAnswerAccept({
    questionId,
    onSuccess: () => {
      setSelectAnser(false);
      alert("답변이 채택되었습니다.");
    },
    onError: () => alert("답변 채택 중 오류가 발생했습니다."),
  });

  // 답변 삭제 mutation
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () =>
      fetchAPI(`/api/answers/${answer.id}`, "DELETE", {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      }),
    onSuccess: () => {
      alert("답변이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["answers", questionId] });
    },
    onError: (error) => {
      console.error("답변 삭제 실패:", error);
      alert("답변 삭제 실패: 인증에 실패했습니다.");
    },
  });

  const handleDelete = () => {
    if (confirm("정말로 이 답변을 삭제하시겠습니까?")) {
      deleteMutation.mutate();
    }
  };

  const authorWithImage = {
    ...answer.author,
    avatarUrl: imageData?.[0]?.preSignedUrl || answer.author.avatarUrl,
  };

  const menuItems: ActionMenuItem[] = answer.author.isMe
    ? [
        {
          id: "edit",
          label: "수정",
          onClick: () => router.push(`/answer/${questionId}?edit=${answer.id}`),
        },
        {
          id: "delete",
          label: "삭제",
          onClick: handleDelete,
          variant: "destructive",
        },
      ]
    : [
        {
          id: "report",
          label: "신고",
          onClick: () => console.log("신고"),
        },
      ];

  return (
    <div className="mb-4 flex flex-col gap-3">
      {answer.accepted && (
        <TextButton
          variant="outline"
          label="채택된 답변"
          className="pointer-events-none border-primary bg-accent text-primary"
          size="sm"
        />
      )}
      <UserInfoField author={authorWithImage} />
      <div className="flex flex-col gap-3">
        {answer.steps.map((step, index) => (
          <div
            className="flex flex-col gap-3 rounded-xl border p-4"
            key={step.stepId}
          >
            <p className="text-xl font-semibold">STEP {index + 1}</p>
            <div className="rounded-xl bg-secondary px-3 py-4 text-foreground">
              <p className="whitespace-pre-wrap break-words">{step.content}</p>
            </div>
            <div>
              {step.images.map((img) => (
                <Image src={img} alt={img} key={img} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <LikeButton onClick={() => {}} likeCount={answer.likeCount} />
        <ActionMenu
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <img src="/Ellipsis.svg" alt="더보기" className="h-5 w-5" />
            </Button>
          }
          items={menuItems}
          align="end"
          side="top"
          showBackdrop={true}
        />
      </div>
      {isAuthor && !answer.accepted && (
        <Button
          variant="brand"
          className="mt-3 w-full text-lg font-normal"
          onClick={() => setSelectAnser(true)}
          disabled={isAccepting}
        >
          {isAccepting ? "채택 중..." : "채택하기"}
        </Button>
      )}
      <SelectModal
        isOpen={selectAnswer}
        onClose={() => setSelectAnser(false)}
        onConfirm={() => acceptAnswer(answer.id.toString())}
        title="채택하시겠습니까?"
        message="채택이 진행되면 취소할 수 없으며, 다른 답변에 대한 채택에는 추가 팜머니가 발생합니다."
      />
    </div>
  );
};

// =====================
// 답변 리스트 페이지
// =====================
export const AnswerDetailPage: FC<{
  questionId: string;
  isAuthor: boolean;
}> = ({ questionId, isAuthor }) => {
  const [page, setPage] = useState(0);
  const [allAnswers, setAllAnswers] = useState<Answer[]>([]);
  const pageSize = 5;

  const {
    data: answerData,
    isLoading: answerLoading,
    isFetching,
  } = useQuery<AnswerListResponse>({
    queryKey: ["answers", questionId, page],
    queryFn: () =>
      fetchAPI(
        `/api/answers/cards?questionId=${questionId}&page=${page}&size=${pageSize}`,
        "GET",
      ),
    enabled: !!questionId,
  });

  useEffect(() => {
    if (answerData?.items) {
      if (page === 0) {
        setAllAnswers(answerData.items);
      } else {
        setAllAnswers((prev) => [...prev, ...answerData.items]);
      }
    }
  }, [answerData, page]);

  const handleLoadMore = () => {
    if (answerData?.hasNext && !isFetching) {
      setPage((prev) => prev + 1);
    }
  };

  if (answerLoading && page === 0) return <div>Loading...</div>;

  return (
    <div>
      {allAnswers.map((answer, index) => (
        <div key={answer.id}>
          <AnswerItem
            answer={answer}
            isAuthor={isAuthor}
            questionId={questionId}
          />
          {index < allAnswers.length - 1 && (
            <div className="-mx-6 border-t-[12px] border-t-[#F4F4F4] py-5" />
          )}
        </div>
      ))}
      {answerData?.hasNext && (
        <div className="mt-6 flex justify-center">
          <TextButton
            label={isFetching ? "로딩 중..." : "답변 더보기"}
            variant={isFetching ? "disabled" : "outline"}
            onClick={handleLoadMore}
            className="w-full text-lg font-normal"
          />
        </div>
      )}
    </div>
  );
};
