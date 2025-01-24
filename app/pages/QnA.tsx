'use client';

import React, { useState, useEffect, useRef } from "react";
import * as S from "../styles/QnA";
import HeaderNon from "../components/Header_Non";
import axios from "axios";
import { subjects } from "../subjects";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  title: string;
  content: string;
}

interface Subject {
  id: number;
  name: string;
}

function QnA() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); // 검색어 상태 추가
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const Thebogi = () => {
    router.push("/Detail");
  };

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

  const fetchQuestions = async (subjectId: number | null) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.log("Access token is missing");
        return;
      }

      const url = subjectId
        ? `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/subject/${subjectId}/latest`
        : `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/latest`;

      window.history.pushState({}, "", `/${subjectId ? `?subject=${subjectId}` : ""}`);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      setQuestions(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
      } else {
        console.error("Unknown error:", error);
      }
    }
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDropdownOpen(false);
    fetchQuestions(subject.id);
  };

  useEffect(() => {
    fetchQuestions(null);
  }, []);

  // 검색 필터링 로직
  const filteredQuestions = questions.filter((question) =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <S.Container>
      <HeaderNon />

      <S.TitleBlock>
        <S.TitleText>원하는 답변 찾기</S.TitleText>
        <S.SearchIcon src="searchBL.svg" />
      </S.TitleBlock>

      <S.SearchBarContainer>
        <S.MenuSVG src="menu.svg" onClick={toggleDropdown} />
        <S.SearchInput
          placeholder={
            selectedSubject
              ? `${selectedSubject.name}에 대해 검색해보세요.`
              : "궁금한 것을 검색해보세요."
          }
          value={searchTerm} // 검색어 상태 연결
          onChange={(e) => setSearchTerm(e.target.value)} // 검색어 업데이트
        />
        <S.SearchSVG src="search.svg" />
      </S.SearchBarContainer>

      {isDropdownOpen && (
        <S.Dropdown ref={dropdownRef}>
          {subjects.map((subject) => (
            <S.DropdownItem key={subject.id} onClick={() => handleSubjectSelect(subject)}>
              {subject.name}
            </S.DropdownItem>
          ))}
        </S.Dropdown>
      )}

      <S.AnswerContainer>
        <S.AnswerBlock>
          <S.TitleText>답변해주기</S.TitleText>
          <S.CheckIcon src="check.svg" />
        </S.AnswerBlock>

        <S.QCbox>
          {filteredQuestions.map((question) => (
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
        <S.DetailName onClick={Thebogi}>더 보기</S.DetailName>
        <S.DetailIcon src="ArrowIcon.svg" />
      </S.DetailBox>
    </S.Container>
  );
}

export default QnA;
