'use client';

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation"; // 'next/navigation'에서 useRouter 가져오기
import { useSearchParams } from "next/navigation"; // useSearchParams 훅 가져오기
import HeaderNon from "../components/Header_Non";
import * as S from "../styles/Content";

// 날짜 포맷을 위한 함수 추가
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

function Content() {
  const [isClient, setIsClient] = useState(false);
  const [shareCount, setShareCount] = useState(0); // 공유 수 상태
  const [heartCount, setHeartCount] = useState(0); // 좋아요 수 상태
  const [isHearted, setIsHearted] = useState(false); // 좋아요 활성화 상태
  const [imageUrl, setImageUrl] = useState(""); // 이미지 URL 상태
  const [question, setQuestion] = useState<any>(null); // 선택한 질문 정보 상태
  const [answerSubmitted, setAnswerSubmitted] = useState(false); // 답변 작성 상태
  const [answer, setAnswer] = useState(""); // 답변 내용 상태
  const [file, setFile] = useState<File | null>(null); // 이미지 파일 상태

  const router = useRouter();
  const searchParams = useSearchParams(); // URL의 쿼리 파라미터를 가져옴
  const questionId = searchParams.get("questionId"); // questionId 파라미터 가져오기

  // questionId가 문자열일 때만 처리되도록 타입 확인
  useEffect(() => {
    if (questionId) {
      console.log("Fetching question details for questionId:", questionId); // questionId 로그 출력
      fetchQuestionDetails(Number(questionId)); // 질문 ID가 있으면 해당 질문 내용 불러오기
    }
  }, [questionId]);

  const fetchQuestionDetails = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token is missing");
        return;
      }

      const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/${id}`; // {id}를 `${id}`로 수정
      console.log("API URL:", url); // API 호출 URL 로그 출력
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      console.log("Response data:", response.data); // API 응답 데이터 로그 출력
      setQuestion(response.data); // 질문 정보 설정

      // 이미 답변이 있는 경우, 답변이 등록된 상태로 설정
      if (response.data.answer) {
        setAnswerSubmitted(true);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
      } else {
        console.error("Unknown error:", error);
      }
    }
  };

  const handleShareClick = () => {
    setShareCount(shareCount + 1);
    // 나중에 URL 공유 기능 구현 예정
  };

  const handleHeartClick = () => {
    if (isHearted) {
      setHeartCount(heartCount - 1); // 좋아요 취소
    } else {
      setHeartCount(heartCount + 1); // 좋아요 추가
    }
    setIsHearted(!isHearted); // 상태 토글
  };

  const handleAnswerClick = () => {
    setAnswerSubmitted(true); // 답변 등록 버튼 클릭 시 상태 변경
  };

  const handleAnswerSubmit = async () => {
    if (!answer) {
      alert("답변을 작성해주세요.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("Access token is missing");
      return;
    }

    const formData = new FormData();
    formData.append("content", answer);
    formData.append("questionId", questionId || ""); // Ensure questionId is added
    formData.append("isAnonymous", "false"); // Set isAnonymous to false
    if (file) {
      formData.append("image", file);
    }

    try {
      const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers`;
      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Answer submitted:", response.data);

      setAnswerSubmitted(true); // 답변 등록 상태로 변경
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
      } else {
        console.error("Unknown error:", error);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setImageUrl(URL.createObjectURL(file)); // 이미지 미리보기
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const backP = () => {
    router.push("/Qna");
  };

  return (
    <S.Container>
      <HeaderNon />
      <S.TurnPage onClick={() => router.back()}>뒤로가기</S.TurnPage>
      
      <S.AnswerContainer>
        <S.AnswerBlock>
          <S.TitleText>답변해주기</S.TitleText>
          <S.CheckIcon src="check.svg" />
        </S.AnswerBlock>

        <S.Qbox>
          <S.Q>Q.</S.Q>
          <S.QC
            value={question?.title || "로딩 중..."} // 질문 제목 표시
            readOnly
            disabled
          />
        </S.Qbox>
        
        <S.Daily>{question?.createdAt ? formatDate(question.createdAt) : "로딩 중..."}</S.Daily>
        <S.ST>과목명: {question?.subjectName || "로딩 중..."}</S.ST>
        <S.User>질문자 : {question?.userName || "로딩 중..."}</S.User>

        <S.Content
          value={question?.content || "로딩 중..."} // 질문 내용 표시
          readOnly
          disabled
        />

        <S.ImageContainer>
          {imageUrl ? (
            <S.Image src={imageUrl} alt="Content Image" />
          ) : (
            <span>사진이 없습니다.</span>
          )}
        </S.ImageContainer>

        <S.SVGbox>
          <S.SoloSVG onClick={handleShareClick}>
            <S.SVG src="Share.svg" />
            <S.count>{shareCount}</S.count>
          </S.SoloSVG>

          <S.SoloSVG onClick={handleHeartClick}>
            <S.SVG src={isHearted ? "Heartplus.svg" : "Heart.svg"} />
            <S.count>{heartCount}</S.count>
          </S.SoloSVG>

          <S.SVG src="More.svg" />
        </S.SVGbox>

        {!answerSubmitted && <S.Answerbtn onClick={handleAnswerClick}>답변하기</S.Answerbtn>}

      </S.AnswerContainer>

      {answerSubmitted && (
        <S.UserAnswerBlock>
          <S.UserAnswerTitle>나의 답변:</S.UserAnswerTitle>
          <S.UserAnswerContent 
            value={answer} 
            onChange={(e) => setAnswer(e.target.value)} 
            placeholder="클릭해서 답변을 작성해주세요." 
          />
          <S.AnswerBB>
            <S.CameraBtn>
              <S.CameraSVG src="Camera.svg" />
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: "none" }} 
                onChange={handleFileChange} 
              />
            </S.CameraBtn>
            <S.AnswerSubmitBtn onClick={handleAnswerSubmit}>답변 등록</S.AnswerSubmitBtn>
          </S.AnswerBB>
        </S.UserAnswerBlock>
      )}
    </S.Container>
  );
}

export default Content;
