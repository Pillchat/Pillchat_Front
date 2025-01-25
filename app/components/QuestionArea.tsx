import React, { useEffect, useRef } from "react";
import * as S from "../styles/QuestionArea";

interface QuestionAreaProps {
  content: string; // 표시할 텍스트 내용
}

const QuestionArea: React.FC<QuestionAreaProps> = ({ content }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절 함수
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // 기존 높이 초기화
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // 콘텐츠 높이에 맞게 높이 설정
    }
  };

  useEffect(() => {
    adjustHeight(); // `content`가 변경될 때마다 높이 재조정
  }, [content]);

  return (
    <S.QC
      ref={textareaRef}
      value={content}
      readOnly
      disabled
    />
  );
};

export default QuestionArea;
