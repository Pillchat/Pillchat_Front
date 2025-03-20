import React, { useEffect, useState } from "react";
import axios from "axios";
import * as S from "../styles/StepRender";

interface Answer {
  id: number;
  content: string;
  isAccepted: boolean;
}

interface StepImages {
  [stepIndex: string]: string | null;
}

interface AnswerImages {
  [answerId: number]: StepImages;
}

interface StepRenderProps {
  answers: Answer[];
  questionOwnerId: number;
  userId: number;
  fetchAnswers: () => void;
}

const StepRender: React.FC<StepRenderProps> = ({ answers, questionOwnerId, userId, fetchAnswers }) => {
  const [answerImages, setAnswerImages] = useState<AnswerImages>({});
  const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null);

  useEffect(() => {
    if (!answers.length) return;

    const fetchAnswerImages = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token이 없습니다.");
        return;
      }

      try {
        const imagesMap: AnswerImages = {};

        await Promise.all(
          answers.map(async ({ id }) => {
            try {
              const response = await axios.get(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers/${id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "ngrok-skip-browser-warning": "69420",
                  },
                  withCredentials: true,
                }
              );

              if (response.data?.images) {
                const stepCount = response.data.content.split(/\n\n|\r\n\r\n/).length;
                const stepImageMap: StepImages = {};
                for (let i = 0; i < stepCount; i++) {
                  stepImageMap[String(i)] = null;
                }

                Object.entries(response.data.images).forEach(([stepIndex, imagePath]) => {
                  stepImageMap[String(stepIndex)] = imagePath
                    ? `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/images/${imagePath}`
                    : null;
                });

                imagesMap[id] = stepImageMap;
              }
            } catch (error) {
              console.error(`답변 ${id}의 이미지 가져오는 중 오류 발생:`, error);
            }
          })
        );

        setAnswerImages(imagesMap);
      } catch (error) {
        console.error("이미지 데이터를 가져오는 중 오류 발생:", error);
      }
    };

    fetchAnswerImages();
  }, [answers]);

  useEffect(() => {
    const acceptedAnswer = answers.find((answer) => answer.isAccepted);
    setSelectedAnswerId(acceptedAnswer ? acceptedAnswer.id : null);
  }, [answers]);

  // ✅ 답변 채택 기능 추가
  const handleAcceptAnswer = async (answerId: number) => {
    try {
      if (selectedAnswerId) {
        alert("이미 채택된 답변이 있습니다. 변경할 수 없습니다.");
        return;
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token이 없습니다.");
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
      alert(error.response?.data?.message || "답변 채택 중 오류 발생");
    }
  };

  return (
    <S.UserAnswerContainer>
      <S.UserAnswerScroll>
        {answers.length > 0 ? (
          answers.map((answerItem) => {
            const steps = answerItem.content.split(/\n\n|\r\n\r\n/);
            const images = answerImages[answerItem.id] || {};
            const isAccepted = answerItem.id === selectedAnswerId;
            const canAccept = userId === questionOwnerId && !selectedAnswerId;

            return (
              <S.AnswerBox key={answerItem.id} style={{ border: isAccepted ? "2px solid gold" : "1px solid gray" }}>
                {steps.map((step, index) => (
                  <S.StepBlock key={index}>
                    <h3>STEP {index + 1}</h3>
                    <p>{step.trim()}</p>
                    {images[String(index)] !== null && images[String(index)] !== undefined && (
                      <S.ImagePreview src={images[String(index)] || undefined} alt={`STEP ${index + 1}`} />
                    )}
                  </S.StepBlock>
                ))}

                {canAccept && (
                  <S.AcceptButton
                  onClick={() => handleAcceptAnswer(answerItem.id)}
                  disabled={isAccepted}
                >
                  {isAccepted ? ":white_check_mark: 채택된 답변" : "채택하기"}
                </S.AcceptButton>
                )}

                {isAccepted && <span>채택된 답변</span>}
              </S.AnswerBox>
            );
          })
        ) : (
          <></>
        )}
      </S.UserAnswerScroll>
    </S.UserAnswerContainer>
  );
};

export default StepRender;