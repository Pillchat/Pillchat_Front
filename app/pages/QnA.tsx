'use client';

import React, { useState } from "react";
import * as S from "../styles/QnA";
import HeaderNon from "../components/Header_Non";

interface Question {
  id: number;
  title: string;
  content: string;
}

const questions: Question[] = [
  { id: 1, title: "안녕하세요 약제학 질문 드립니다!", content: "약제학에 대한 자세한 질문 내용입니다. 이 내용은 예시로 작성되었습니다." },
  { id: 2, title: "화학 관련 질문입니다.", content: "화학에 대한 자세한 질문 내용입니다. 이 내용은 예시로 작성되었습니다." },
];

function QnA() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <S.Container>
        <HeaderNon />

        <S.TitleBlock>
            <S.TitleText>원하는 답변 찾기</S.TitleText>
            <S.SearchIcon src="searchBL.svg" />
        </S.TitleBlock>

        <S.SearchBarContainer>
            <S.MenuSVG src="menu.svg" />
            <S.SearchInput placeholder="원하는 답변을 검색해보세요." />
            <S.SearchSVG src="search.svg" />
        </S.SearchBarContainer>

        <S.AnswerContainer>
            <S.AnswerBlock>
                <S.TitleText>답변해주기</S.TitleText>
                <S.CheckIcon src="check.svg" />
            </S.AnswerBlock>

            <S.QCbox>
                {questions.map((question) => (
                    <S.QuestionBox key={question.id}>
                        <S.EST>
                            <S.Qbox>
                                <S.Q>Q.</S.Q>
                                <S.QC>{question.title}</S.QC>
                            </S.Qbox>
                            <S.InIcon
                                src="ArrowIcon.svg"
                                onClick={() => toggleExpand(question.id)}
                                style={{
                                transform: expandedId === question.id ? "rotate(90deg)" : "rotate(180deg)",
                                transition: "transform 0.3s ease",
                                }}
                            />
                        </S.EST>
                    {expandedId === question.id && (
                        <S.ExpandedContent>
                        {question.content.length > 100
                            ? question.content.substring(0, 100) + "..."
                            : question.content}
                        </S.ExpandedContent>
                    )}
                    </S.QuestionBox>
                ))}
                </S.QCbox>
            </S.AnswerContainer>

            <S.DetailBox>
                <S.DetailName>더 보기</S.DetailName>
                <S.DetailIcon src="ArrowIcon.svg" />
            </S.DetailBox>
        </S.Container>
  );
}

export default QnA;
