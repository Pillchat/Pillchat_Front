'use client'

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import HeaderNon from "../components/Header_Non";
import Footer from "../components/Footer";
import * as S from "../styles/Detail";
import { subjects } from "../subjects";

interface Question {
  id: number;
  title: string;
  content: string;
}

interface Subject {
  id: number;
  name: string;
}

function Detail() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const router = useRouter(); // useRouter 훅을 이용하여 페이지 이동

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const fetchQuestions = async (subjectId: number | null) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token is missing");
        return;
      }

      const url = subjectId
        ? `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/subject/${subjectId}`
        : `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions`;

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

  const handleQuestionClick = (question: Question) => {
    router.push(`/Content?questionId=${question.id}`); // 선택한 질문의 ID를 URL 파라미터로 넘김
  };

  useEffect(() => {
    fetchQuestions(null); // 초기 질문 목록 불러오기
  }, []);

  return (
    <S.Container>
      <HeaderNon />
      <S.TurnPage onClick={() => router.back()}>뒤로가기</S.TurnPage>

      <S.AnswerContainer>
        <S.AnswerBlock>
          <S.TitleText>답변해주기</S.TitleText>
          <S.CheckIcon src="check.svg" />
        </S.AnswerBlock>

        <S.SubmitBox isOpen={isDropdownOpen} onClick={toggleDropdown}>
          <S.SubmitTitleText>
            {selectedSubject ? selectedSubject.name : "과목 선택"}
          </S.SubmitTitleText>
          <S.SubmitDesText>제일 자신있는 과목을 선택해서 답변해보세요.</S.SubmitDesText>
          <S.DetailIcon src="ArrowIcon.svg" isOpen={isDropdownOpen} />

          {isDropdownOpen && (
            <S.Dropdown>
              {subjects.map((subject) => (
                <S.DropdownOption
                  key={subject.id}
                  onClick={() => handleSubjectSelect(subject)}
                >
                  {subject.name}
                </S.DropdownOption>
              ))}
            </S.Dropdown>
          )}
        </S.SubmitBox>

        <S.QCbox>
          {questions.map((question) => (
            <S.QuestionBox key={question.id}>
              <S.EST>
                <S.Qbox onClick={() => handleQuestionClick(question)}>
                  <S.Q>Q.</S.Q>
                  <S.QC>{question.title.length > 17
                    ? question.title.substring(0, 17) + "..."
                    : question.title}</S.QC>
                </S.Qbox>
                <S.InIcon
                  src="ArrowIcon.svg"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(question.id);
                  }}
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

      <Footer />
    </S.Container>
  );
}

export default Detail;
