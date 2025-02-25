
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import * as S from "../styles/StepRender";

// interface Answer {
//   id: number;
//   content: string;
// }

// interface AnswerImages {
//   [key: number]: string[]; // 각 답변 ID에 대한 이미지 URL 배열
// }

// interface StepRenderProps {
//   answers: Answer[];
// }

// const StepRender: React.FC<StepRenderProps> = ({ answers }) => {
//   const [answerImages, setAnswerImages] = useState<AnswerImages>({});

//   useEffect(() => {
//     if (!answers.length) return;

//     const fetchAnswerImages = async () => {
//       const token = localStorage.getItem("access_token");
//       if (!token) {
//         console.error("Access token이 없습니다.");
//         return;
//       }
    
//       try {
//         const imagesMap: AnswerImages = {};
    
//         await Promise.all(
//           answers.map(async ({ id }) => {
//             try {
//               const response = await axios.get(
//                 `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers/${id}`,
//                 {
//                   headers: {
//                     Authorization: `Bearer ${token}`,
//                     "ngrok-skip-browser-warning": "69420",
//                   },
//                 }
//               );
    
//               if (response.data?.images) {
//                 imagesMap[id] = response.data.images; // { stepIndex: imageUrl } 형태로 저장
//               }
//             } catch (error) {
//               console.error(`답변 ${id}의 이미지 가져오는 중 오류 발생:`, error);
//             }
//           })
//         );
    
//         setAnswerImages(imagesMap);
//       } catch (error) {
//         console.error("이미지 데이터를 가져오는 중 오류 발생:", error);
//       }
//     };    

//     fetchAnswerImages();
//   }, [answers]);

//   return (
//     <S.UserAnswerContainer>
//       <S.UserAnswerScroll>
//         {answers.length > 0 ? (
//           answers.map((answerItem) => {
//             const steps = answerItem.content.split(/\n\n|\r\n\r\n/);
//             const images = answerImages[answerItem.id] || [];

//             return (
//               <S.AnswerBox key={answerItem.id}>
//                 {steps.map((step, index) => (
//                   <S.StepBlock key={index}>
//                     <h3>STEP {index + 1}</h3>
//                     <p>{step.trim()}</p>
//                     {images[index] && (
//                       <S.ImagePreview src={images[index]} alt={`STEP ${index + 1}`} />
//                     )}
//                   </S.StepBlock>
//                 ))}
//               </S.AnswerBox>
//             );
//           })
//         ) : (
//           <></>
//         )}
//       </S.UserAnswerScroll>
//     </S.UserAnswerContainer>
//   );
// };

// export default StepRender;


import React, { useEffect, useState } from "react";
import axios from "axios";
import * as S from "../styles/StepRender";

interface Answer {
  id: number;
  content: string;
}

interface StepImages {
  [stepIndex: string]: string | null; // STEP 인덱스별 이미지 매칭 (문자열 키 유지)
}

interface AnswerImages {
  [answerId: number]: StepImages; // 답변 ID별 STEP 이미지 매칭
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

              console.log(`답변 ${id}의 응답 데이터:`, response.data);

              if (response.data?.images) {
                const stepCount = response.data.content.split(/\n\n|\r\n\r\n/).length; // 총 STEP 개수

                // 모든 STEP을 `null`로 초기화하여 이미지가 없는 경우에도 순서 유지
                const stepImageMap: StepImages = {};
                for (let i = 0; i < stepCount; i++) {
                  stepImageMap[String(i)] = null; // 이미지가 없으면 null
                }

                // 이미지가 있을 경우, 해당 STEP에만 실제 이미지 경로를 설정
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
  }, [answers, process.env.NEXT_PUBLIC_REACT_APP_BASE_URL]);

  return (
    <S.UserAnswerContainer>
      <S.UserAnswerScroll>
        {answers.length > 0 ? (
          answers.map((answerItem) => {
            const steps = answerItem.content.split(/\n\n|\r\n\r\n/);
            const images = answerImages[answerItem.id] || {};

            return (
              <S.AnswerBox key={answerItem.id}>
                {steps.map((step, index) => (
                  <S.StepBlock key={index}>
                    <h3>STEP {index + 1}</h3>
                    <p>{step.trim()}</p>
                    {images[String(index)] !== null && images[String(index)] !== undefined && (
                      <S.ImagePreview src={images[String(index)] || undefined} alt={`STEP ${index + 1}`} />
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