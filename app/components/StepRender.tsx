import * as S from "../styles/StepRender";

interface Answer {
  id: number;
  content: string;
  images?: string[];
}

const StepRender = ({ answers }: { answers: Answer[] }) => {
  return (
    <S.UserAnswerContainer>
      <S.UserAnswerBlockComent>나의 답변:</S.UserAnswerBlockComent>
      <S.UserAnswerScroll>
        {answers.length > 0 ? (
          answers.map((answerItem) => {
            const steps = answerItem.content.split(/\n\n|\r\n\r\n/); // 다양한 줄바꿈 대응
            return (
              <S.AnswerBox key={answerItem.id}>
                {steps.map((step, index) => (
                  <S.StepBlock key={index}>
                    <h3>STEP {index + 1}</h3>
                    <p>{step.trim()}</p> {/* 공백 제거 */}
                    {answerItem.images?.[index] && (
                      <S.ImagePreview src={answerItem.images[index]} alt={`STEP ${index + 1}`} />
                    )}
                  </S.StepBlock>
                ))}
              </S.AnswerBox>
            );
          })
        ) : (
          <p>아직 답변이 없습니다.</p>
        )}
      </S.UserAnswerScroll>
    </S.UserAnswerContainer>
  );
};

export default StepRender;
