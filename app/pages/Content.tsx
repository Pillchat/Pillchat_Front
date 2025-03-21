'use client'

  import React, { useState, useEffect, useRef } from "react";
  import axios from "axios";
  import { useRouter } from "next/navigation";
  import { useSearchParams } from "next/navigation";
  import HeaderNon from "../components/Header_Non";
  import Footer from "../components/Footer";
  import * as S from "../styles/Content";
  import QuestionArea from "../components/QuestionArea";
  import ContentArea from "../components/ContentArea";
  import KakaoShareButton from "../components/kakaoShareBtn";
  import LikeButton from "../components/LikeButton";
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

  interface Answer {
    id: number;
    content: string;
    userId: number;
    userName: string;
    images: Record<string, string | null>;
    createdAt: string;
    accepted: boolean;
  }

  interface Question {
    id: number;
    title: string;
    content: string;
    ownerId: number;
    createdAt: string;
    answers: Answer[];
    subjectName?: string; // 추가
    userName?: string; // 추가
    questionOwner: boolean;
  }

  function Content() {
    const [isClient, setIsClient] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>("");
    const [shareCount, setShareCount] = useState(0);
    const [view, setView] = useState(0);
    const [id, setId] = useState<number>(5);
    const [question, setQuestion] = useState<Question | null>(null);
    const [hasAnswer, setHasAnswer] = useState(false);
    const [isAnswering, setIsAnswering] = useState(false);
    const [questionOwner, setQuestionOwner] = useState(false);
    const [userId, setUserId] = useState("");

    const router = useRouter();
    const searchParams = useSearchParams();
    const questionId = searchParams.get("questionId");
    const hasFetched = useRef(false);

    if (!questionId) return null;

    if (typeof window !== "undefined") {
      const item = localStorage.getItem("key");
    }

    // 질문과 답변 데이터를 한 번에 가져오는 함수
    const fetchQuestionDetails = async (questionId: number) => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          console.error("Access token이 없습니다.");
          return;
        }

        console.log("질문 및 답변 데이터 가져오기");
        
        const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/${questionId}/with-answers`;
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420",
          },
          withCredentials: true,
        });
        
        setQuestion(response.data);
        setId(response.data.id);
        setUserId(response.data.userId);
        setView(response.data.viewCount);
        setQuestionOwner(response.data.questionOwner);

        if (response.data.images && response.data.images.length > 0) {
          const fileName = response.data.images[0].url;
          const fullImageUrl = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/images/${fileName}`;
          setImageUrl(fullImageUrl);
        } else {
          setImageUrl("");
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("Axios 오류:", error.response?.data || error.message);
        } else {
          console.error("알 수 없는 오류:", error);
        }
      }
    };

    useEffect(() => {
      console.log("이미지 URL:", imageUrl);
    }, [imageUrl]);
    

    useEffect(() => {
      if (!questionId || hasFetched.current) return;
      hasFetched.current = true;
      fetchQuestionDetails(Number(questionId));
    }, [questionId]);

    useEffect(() => {
      if (question?.answers && question.answers.length > 0) {
        setHasAnswer(true);
      } else {
        setHasAnswer(false);
      }
    }, [question, question?.answers]);
    
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
      setIsClient(true);
    }, []);

    const fetchAnswers = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers`);
        // 상태 업데이트 로직이 필요하면 여기에 추가
        console.log("답변 목록:", response.data);
      } catch (error) {
        console.error("답변 목록을 불러오는 중 오류 발생:", error);
      }
    };
    

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

              <LikeButton questionId={questionId} />

              <S.SVG src="More.svg" />
          </S.SVGbox>

          {!hasAnswer && !isAnswering && (
            <S.Answerbtn onClick={handleAnswerClick}>답변하기</S.Answerbtn>
          )}

          </S.Udong>

        </S.AnswerContainer>

        {hasAnswer ? (
          <S.UserAnswerContainer>
            <StepRender 
              answers={question?.answers || []} 
              questionOwner={questionOwner} 
              userId={Number(userId)}
              fetchAnswers={fetchAnswers} 
            />

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