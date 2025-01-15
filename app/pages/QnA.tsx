'use client';

import React, { useState, useEffect, useRef } from "react";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <S.Container>
      <HeaderNon />

      <S.TitleBlock>
        <S.TitleText>원하는 답변 찾기</S.TitleText>
        <S.SearchIcon src="searchBL.svg" />
      </S.TitleBlock>

      <S.SearchBarContainer>
        <S.MenuSVG src="menu.svg" onClick={toggleDropdown} />
        <S.SearchInput placeholder="원하는 답변을 검색해보세요." />
        <S.SearchSVG src="search.svg" />
      </S.SearchBarContainer>

      {isDropdownOpen && (
        <S.Dropdown ref={dropdownRef}>
          <S.DropdownItem>약사윤리</S.DropdownItem>
          <S.DropdownItem>생화학</S.DropdownItem>
          <S.DropdownItem>미생물학</S.DropdownItem>
          <S.DropdownItem>물리약학</S.DropdownItem>
          <S.DropdownItem>의약품분석학</S.DropdownItem>
          <S.DropdownItem>약물치료학</S.DropdownItem>
          <S.DropdownItem>해부생리학</S.DropdownItem>
          <S.DropdownItem>약물학</S.DropdownItem>
          <S.DropdownItem>의약품합성학</S.DropdownItem>
          <S.DropdownItem>생약학</S.DropdownItem>
          <S.DropdownItem>약제학</S.DropdownItem>
          <S.DropdownItem>약물동태학</S.DropdownItem>
          <S.DropdownItem>병태생리학</S.DropdownItem>
          <S.DropdownItem>면역학</S.DropdownItem>
          <S.DropdownItem>보건사회약학</S.DropdownItem>
          <S.DropdownItem>독성학</S.DropdownItem>
        </S.Dropdown>
      )}

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
