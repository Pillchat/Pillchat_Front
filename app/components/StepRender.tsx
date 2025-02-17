import React, { useEffect, useState } from "react";
import axios from "axios";
import * as S from "../styles/StepRender";

interface Answer {
  id: number;
  content: string;
}

interface AnswerImages {
  [key: number]: string[]; // 각 답변 ID에 대한 이미지 URL 배열
}

interface StepRenderProps {
  answers: Answer[];
}

const StepRender: React.FC<StepRenderProps> = ({ answers }) => {
  const [answerImages, setAnswerImages] = useState<AnswerImages>({});

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
                }
              );

              if (response.data?.images) {
                const sortedImageKeys = Object.keys(response.data.images)
                  .sort((a, b) => Number(a.split("_")[1]) - Number(b.split("_")[1])) // image_1, image_2 순 정렬
                  .map((key) => response.data.images[key]);

                  const imageUrls = sortedImageKeys.map(
                    (fileName) => `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/images/${fileName}`
                  );                  

                imagesMap[id] = imageUrls;
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

  return (
    <S.UserAnswerContainer>
      <S.UserAnswerScroll>
        {answers.length > 0 ? (
          answers.map((answerItem) => {
            const steps = answerItem.content.split(/\n\n|\r\n\r\n/);
            const images = answerImages[answerItem.id] || [];

            return (
              <S.AnswerBox key={answerItem.id}>
                {steps.map((step, index) => (
                  <S.StepBlock key={index}>
                    <h3>STEP {index + 1}</h3>
                    <p>{step.trim()}</p>
                    {images[index] && (
                      <S.ImagePreview src={images[index]} alt={`STEP ${index + 1}`} />
                    )}
                  </S.StepBlock>
                ))}
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
