'use client';

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import HeaderNon from "../components/Header_Non";
import * as S from "../styles/Detail";

interface Question {
  id: number;
  title: string;
  content: string;
}

const questions: Question[] = [
  { id: 1, title: "안녕하세요 약제학 질문 드립니다!", content: "약제학에 대한 자세한 질문 내용입니다. 이 내용은 예시로 작성되었습니다." },
  { id: 2, title: "화학 관련 질문입니다.", content: "화학에 대한 자세한 질문 내용입니다. 이 내용은 예시로 작성되었습니다." },
];

function Detail() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("과목명");
  const [expandedId, setExpandedId] = useState<number | null>(null); // State for expanded content

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleOptionClick = (option: any) => {
    setSelectedOption(option);
    setIsDropdownOpen(false);
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id)); // Toggle expanded content
  };

  return (
    <S.Container>
      <HeaderNon />
      <S.TurnPage>뒤로가기</S.TurnPage>

      <S.AnswerContainer>
        <S.AnswerBlock>
          <S.TitleText>답변해주기</S.TitleText>
          <S.CheckIcon src="check.svg" />
        </S.AnswerBlock>

        <S.SubmitBox isOpen={isDropdownOpen} onClick={toggleDropdown}>
          <S.SubmitTitleText>{selectedOption}</S.SubmitTitleText>
          <S.SubmitDesText>제일 자신있는 과목을 선택해서 답변해보세요.</S.SubmitDesText>
          <S.DetailIcon src="ArrowIcon.svg" isOpen={isDropdownOpen} />

          <S.NonDrop>
            {isDropdownOpen && (
              <S.Dropdown>
                {["약제학", "해부학", "생리학", "미생물학"].map((subject) => (
                  <S.DropdownOption
                    key={subject}
                    onClick={() => handleOptionClick(subject)}
                    isSelected={selectedOption === subject}
                  >
                    {subject}
                  </S.DropdownOption>
                ))}
              </S.Dropdown>
            )}
          </S.NonDrop>
        </S.SubmitBox>

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
    </S.Container>
  );
}

export default Detail;
