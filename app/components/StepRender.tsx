import axios from "axios";
import { useEffect, useState } from "react";
import * as S from "../styles/StepRender";

interface Answer {
  id: number;
  title: string;
  content: string;
  image?: string;
}

const fetchAnswers = async (questionId: number, setAnswers: Function) => {
  try {
    const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers/question/${questionId}`;
    const response = await axios.get(url, {
      headers: {
        "ngrok-skip-browser-warning": "69420",
      },
    });

    setAnswers(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios 오류:", error.response?.data || error.message);
    } else {
      console.error("알 수 없는 오류:", error);
    }
  }
};

const StepRender = ({ questionId }: { questionId: number }) => {
  const [answers, setAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    fetchAnswers(questionId, setAnswers);
  }, [questionId]);

  return (
    <S.UserAnswerContainer>
      <S.UserAnswerBlockComent>유저들의 답변:</S.UserAnswerBlockComent>
      <S.UserAnswerScroll>
        {answers.length > 0 ? (
          answers.map((answerItem, index) => (
            <S.UserAnswerContentList key={answerItem.id}>
              <S.StepTitle>Step {index + 1}</S.StepTitle>
              <S.StepContent>{answerItem.content}</S.StepContent>
              {answerItem.image && <S.StepImage src={answerItem.image} alt={`Step ${index + 1} 이미지`} />}
            </S.UserAnswerContentList>
          ))
        ) : (
          <p>아직 답변이 없습니다.</p>
        )}
      </S.UserAnswerScroll>
    </S.UserAnswerContainer>
  );
};

export default StepRender;
