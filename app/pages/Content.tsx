'use client'

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useHeart } from "../components/HeartContext";
import { useSearchParams } from "next/navigation";
import HeaderNon from "../components/Header_Non";
import Footer from "../components/Footer";
import * as S from "../styles/Content";
import QuestionArea from "../components/QuestionArea";
import ContentArea from "../components/ContentArea";
import KakaoShareButton from "../components/kakaoShareBtn";
import StepForm from "../components/StepForm";
import StepRender from "../components/StepRender";

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
  const [imageUrl, setImageUrl] = useState<string>("");

  const [shareCount, setShareCount] = useState(0); // 공유 수 상태
  const [heartCount, setHeartCount] = useState(0); // 좋아요 수 상태
  const [answers, setAnswers] = useState<any[]>([]); // 여러 답변을 배열로 저장
  const [view, setView] = useState(0); // 조회수 상태 변수 정의
  const [id, setId] = useState<number>(5);  // id 상태 변수 정의

  const [isHearted, setIsHearted] = useState(false); // 좋아요 활성화 상태
  const [question, setQuestion] = useState<any>(null); // 선택한 질문 정보 상태
  const [hasAnswer, setHasAnswer] = useState(false); // 답변 여부 상태
  const [isAnswering, setIsAnswering] = useState(false); // 답변 작성 상태
  const [answer, setAnswer] = useState(""); // 답변 내용 상태
  const [file, setFile] = useState<File | null>(null); // 이미지 파일 상태

  const router = useRouter();
  const searchParams = useSearchParams(); // URL의 쿼리 파라미터를 가져옴
  const questionId = searchParams.get("questionId"); // questionId 파라미터 가져오기
  const { heartData, toggleHeart } = useHeart();

  if (!questionId) return null;

  if (typeof window !== 'undefined') {
    // CSR, SSR window 오류 해결 함수
    const item = localStorage.getItem('key');
  }

  // 질문 상세 정보를 가져오는 함수
  const fetchQuestionDetails = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token이 없습니다.");
        return;
      }

      console.log("질문 받아오는 횟수")

      const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/${id}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
          
        },
        withCredentials: true,
      });

      setQuestion(response.data); // 질문 데이터를 상태에 저장
      setId(response.data.id); // id를 받아온 데이터에서 설정
      fetchAnswerStatus(id); // 답변 상태를 확인하는 함수 호출
      setView(response.data.viewCount); // 조회수 상태 설정

      // 이미지 URL 처리
      if (response.data.images && response.data.images.length > 0) {
        const imagePath = response.data.images[0].url; // 이미지 경로
        const fullImageUrl = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/images/${imagePath}`;

        // URL이 제대로 출력되는지 확인
        if (fullImageUrl.startsWith("http") || fullImageUrl.startsWith("https")) {
          setImageUrl(fullImageUrl);
        } else {
          console.error("유효하지 않은 이미지 URL:", fullImageUrl);
        }
      } else {
        console.error("이미지 정보가 없습니다.");
        setImageUrl(""); // 이미지가 없으면 null로 설정
      }

      console.log("이미지 url 상태",imageUrl);
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios 오류:", error.response?.data || error.message);
      } else {
        console.error("알 수 없는 오류:", error);
      }
    }
  };

  const fetchAnswerStatus = async (id: number) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token이 없습니다.");
        return;
      }

      const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers/question/${questionId}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
        withCredentials: true,
      });

      setAnswers(response.data); // 여러 개의 답변을 상태에 저장
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios 오류:", error.response?.data || error.message);
      } else {
        console.error("알 수 없는 오류:", error);
      }
    }
  };

  // 답변 제출 함수
  const handleAnswerSubmit = async () => {
    if (!answer) {
      alert("답변을 작성해주세요.");
      return;
  }

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("Access token이 없습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("content", answer);
    formData.append("questionId", questionId || ""); // questionId 추가
    formData.append("isAnonymous", JSON.stringify(false)); // 문자열로 변환된 boolean 전달
    if (file) {
      formData.append("image", file); // 이미지 파일 첨부
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

      console.log("답변 제출:", response.data);

      // 답변이 제출된 후 해당 질문에 대한 답변을 다시 GET 요청으로 가져오기
      fetchAnswerStatus(Number(questionId)); // 새로 추가된 답변을 가져옴

      setHasAnswer(true); // 답변이 제출되면 hasAnswer 상태 업데이트
      setIsAnswering(false); // 답변 작성 완료 후 UI 상태 변경
      setAnswer(""); // 답변 필드를 초기화하여 새 답변 작성 준비
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios 오류:", error.response?.data || error.message);
      } else {
        console.error("알 수 없는 오류:", error);
      }
    }
  };

  // 파일 선택 처리 함수
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setImageUrl(URL.createObjectURL(file)); // 이미지 미리보기
    }
  };

  // 공유 클릭 처리 함수
  const handleShareClick = () => {
    setShareCount(shareCount + 1); // 공유 수 증가
  };

  // 답변 작성 상태로 변경하는 함수
  const handleAnswerClick = () => {
    setIsAnswering(true); // 답변 작성 상태로 변경
    setHasAnswer(false); // 답변이 있는 경우에도 작성 상태로 전환
  };

  useEffect(() => {
    if (!questionId) return;

    const fetchAnswers = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers/question/${questionId}`;
        const response = await axios.get(url, {
          headers: {
            "ngrok-skip-browser-warning": "69420",
          },
        });

        const formattedAnswers = response.data.map((answer: any) => ({
          id: answer.id,
          content: answer.content,
          images: answer.images || [],
        }));

        setAnswers(formattedAnswers);
      } catch (error) {
        console.error("답변 가져오기 오류:", error);
      }
    };

    fetchAnswers();
  }, [questionId]);

  useEffect(() => {
    if (typeof window !== "undefined" && questionId) {
      const storedHearted = localStorage.getItem(`isHearted_${questionId}`);
      if (storedHearted) {
        setIsHearted(JSON.parse(storedHearted));
      }
    }
  }, [questionId]);

  useEffect(() => {
    if (questionId) {
      fetchQuestionDetails(Number(questionId));
    }
  }, [questionId]);  

  useEffect(() => {
    setHasAnswer(answers.length > 0); // answers 배열에 따라 hasAnswer 상태 업데이트
  }, [answers]);

  // isHearted 값이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem(`isHearted_${questionId}`, JSON.stringify(isHearted));
  }, [isHearted, questionId]);

  // 주기적으로 답변 상태를 확인하는 useEffect
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (questionId) {
        console.log("새로운 답변을 확인 중...");
        fetchAnswerStatus(Number(questionId)); // 일정 시간마다 답변 상태 확인
      }
    }, 300000); // 5초마다 확인

    return () => clearInterval(intervalId); // 컴포넌트 unmount 시 interval 해제
  }, [questionId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <>
    <S.Container>
      <HeaderNon />
      <S.TurnPage onClick={() => router.back()}>뒤로가기</S.TurnPage>

      <S.AnswerContainer>
        <S.AnswerBlock>
          <S.TitleText>답변해주기</S.TitleText>
          <S.CheckIcon src="check.svg" />
        </S.AnswerBlock>

        <S.Udong>
          <S.Qbox>
            <S.Q>Q.</S.Q>
            <QuestionArea content={question?.title || ""} />
          </S.Qbox>
        
          <S.Daily>{question?.createdAt ? formatDate(question.createdAt) : "로딩 중..."}</S.Daily>
          <S.ST>과목명: {question?.subjectName || "로딩 중..."}</S.ST>
          <S.User>질문자 : {question?.userName || "로딩 중..."}</S.User>

          <ContentArea content={question?.content || ""}></ContentArea>

          {imageUrl ? (
            <S.ImageContainer src={imageUrl} alt="이미지 기능은 서버 문제로 적용이 안됩니다." />
          ) : (
            <></>
          )}

          <S.SVGbox>
            <S.SoloSVG>
              <S.eyes>조회수</S.eyes>
              <S.count>{view}</S.count>
            </S.SoloSVG>

            <S.SoloSVG onClick={handleShareClick}>
              <KakaoShareButton />
              <S.count>{shareCount}</S.count>
            </S.SoloSVG>

            <S.SoloSVG>
              <S.SVG onClick={() => toggleHeart(questionId)} src={heartData[questionId]?.isHearted ? "HeartPlus.svg" : "Heart.svg"} />
              <S.count>{heartData[questionId]?.count ?? 0}</S.count>
            </S.SoloSVG>

            <S.SVG src="More.svg" />
        </S.SVGbox>

        {!hasAnswer && !isAnswering && (
          <S.Answerbtn onClick={handleAnswerClick}>답변하기</S.Answerbtn>
        )}

        </S.Udong>

      </S.AnswerContainer>

      {hasAnswer ? (
        <S.UserAnswerContainer>
          <StepRender answers={answers} />
          {!isAnswering && (
            <S.AnswerPlusBtn onClick={handleAnswerClick}>답변하기</S.AnswerPlusBtn>
          )}
        </S.UserAnswerContainer>
      ) : isAnswering ? (
        <S.UserAnswerBlock>
          <StepForm />
        </S.UserAnswerBlock>
      ) : (
        <></>
      )}
    </S.Container>
  <Footer />
  </>
  );
}

export default Content;