import React from "react";
import * as S from "../styles/StepRender";
import axios from "axios";

interface Answer {
  id: number;
  content: string;
  userId: number;
  userName: string;
  images: Record<string, string | null>;
  createdAt: string;
  accepted: boolean;
}

interface StepRenderProps {
  answers: Answer[];
  questionOwner: boolean;
  userId: number;
  fetchAnswers: () => void;
}

const StepRender: React.FC<StepRenderProps> = ({ 
  answers, 
  questionOwner, 
  fetchAnswers 
}) => {
  const handleAcceptAnswer = async (answerId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token is missing");
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers/${answerId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420",
          },
          withCredentials: true,
        }
      );

      alert("답변이 채택되었습니다.");
      fetchAnswers();
    } catch (error: any) {
      console.error("답변 채택 오류:", error);
      alert(error.response?.data?.message || "답변 채택 중 오류가 발생했습니다");
    }
  };



  return (
    <S.UserAnswerContainer>
      <S.UserAnswerScroll>
        {answers.map((answer) => {
          const steps = answer.content.split(/\n\n|\r\n\r\n/);

          return (
            <S.AnswerBox 
              key={answer.id} 
              style={{ border: answer.accepted ? "2px solid gold" : "1px solid gray" }}
            >
              {steps.map((step, index) => (
                <S.StepBlock key={index}>
                  <h3>STEP {index + 1}</h3>
                  <p>{step.trim()}</p>
                  {answer.images[index] && (
                    <S.ImagePreview 
                      src={`${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/images/${answer.images[index]}`}
                      alt={`STEP ${index + 1}`} 
                    />
                  )}
                </S.StepBlock>
              ))}

              {questionOwner && (
                <S.AcceptButton
                  onClick={() => handleAcceptAnswer(answer.id)}
                  disabled={answer.accepted}
                >
                  {answer.accepted ? "✅ 채택된 답변" : "채택하기"}
                </S.AcceptButton>
              )}

              {answer.accepted && <span>채택된 답변</span>}
            </S.AnswerBox>
          );
        })}
      </S.UserAnswerScroll>
    </S.UserAnswerContainer>
  );
};

export default StepRender;