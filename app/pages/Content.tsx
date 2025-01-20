'use client'

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
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
  const [hasAnswer, setHasAnswer] = useState(false); // 답변 여부 상태
  const [isAnswering, setIsAnswering] = useState(false); // 답변 작성 상태
  const [answer, setAnswer] = useState(""); // 답변 내용 상태
  const [file, setFile] = useState<File | null>(null); // 이미지 파일 상태
  const [answers, setAnswers] = useState<any[]>([]); // 여러 답변을 배열로 저장
  const [view, setView] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams(); // URL의 쿼리 파라미터를 가져옴
  const questionId = searchParams.get("questionId"); // questionId 파라미터 가져오기

  useEffect(() => {
    if (questionId) {
      fetchQuestionDetails(Number(questionId));
      fetchLikeCount(Number(questionId));
      const storedHearted = localStorage.getItem(`isHearted_${questionId}`);
      if (storedHearted) {
        setIsHearted(JSON.parse(storedHearted));
      }
    }
  }, [questionId]);

  useEffect(() => {
    setHasAnswer(answers.length > 0); // answers 배열에 따라 hasAnswer 상태 업데이트
  }, [answers]);


  // isHearted 값이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem(`isHearted_${questionId}`, JSON.stringify(isHearted));
  }, [isHearted, questionId]);

  const toggleHeart = () => {
    setIsHearted((prev) => !prev);
  };

// 좋아요 상태와 좋아요 개수를 관리하는 함수
const handleHeartClick = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("Access token이 없습니다.");
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/${questionId}/like`;

    if (isHearted) {
      // 좋아요 취소
      await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
        withCredentials: true,
      });
      setHeartCount((prev) => prev - 1); // 좋아요 개수 감소

    } else {
      // 좋아요 추가
      await axios.post(url, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });
      setHeartCount((prev) => prev + 1); // 좋아요 개수 증가
    }

    // 상태 변경 후 isHearted와 heartCount 업데이트
    setIsHearted((prev) => !prev);
  } catch (error) {
    console.error("Axios 오류:", error);
  }
};

// 좋아요 개수 가져오는 함수 (처음에만 한번 호출)
const fetchLikeCount = async (id: number) => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("Access token이 없습니다.");
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/${id}/likeCount`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "69420", },
    });
    setHeartCount(response.data); // 서버에서 받아온 좋아요 개수로 상태 업데이트
  } catch (error) {
    console.error("좋아요 개수 가져오기 오류:", error);
  }
};

// useEffect에서 중복 호출을 피하도록 수정
useEffect(() => {
  if (questionId) {
    fetchLikeCount(Number(questionId)); // questionId가 있을 때만 좋아요 개수 가져오기
  }
}, [questionId]);



  // 컴포넌트 로드 시, 그리고 questionId가 변경될 때마다 fetchLikeCount 호출
  useEffect(() => {
    if (questionId) {
      fetchLikeCount(Number(questionId)); // questionId를 숫자로 변환하여 전달
    }
  }, [questionId]); // questionId가 변경될 때마다 실행
  


  // 질문 상세 정보를 가져오는 함수
const fetchQuestionDetails = async (id: number) => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("Access token이 없습니다.");
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/${id}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "69420",
      },
      withCredentials: true,
    });

    console.log("질문 정보:", response.data);
    setQuestion(response.data); // 질문 데이터를 상태에 저장
    fetchAnswerStatus(id); // 답변 상태를 확인하는 함수 호출
    setView(response.data.viewCount);
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

      const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers/question/${questionId}/user`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
        withCredentials: true,
      });

      console.log("답변 받기:", response.data);
      setAnswers(response.data); // 여러 개의 답변을 상태에 저장
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Axios 오류:", error.response?.data || error.message);
      } else {
        console.error("알 수 없는 오류:", error);
      }
    }
  };

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

  // 공유 클릭 처리 함수
  const handleShareClick = () => {
    setShareCount(shareCount + 1); // 공유 수 증가
  };

  // 답변 작성 상태로 변경하는 함수
  const handleAnswerClick = () => {
    setIsAnswering(true); // 답변 작성 상태로 변경
    setHasAnswer(false); // 답변이 있는 경우에도 작성 상태로 전환
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
          <S.SoloSVG>
            <S.eyes>조회수</S.eyes>
            <S.count>{view}</S.count>
          </S.SoloSVG>

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

        {!hasAnswer && !isAnswering && (
          <S.Answerbtn onClick={handleAnswerClick}>답변하기</S.Answerbtn>
        )}
      </S.AnswerContainer>

      {hasAnswer ? (
  <S.UserAnswerContainer>
    <S.UserAnswerBlockComent>나의 답변:</S.UserAnswerBlockComent>
    <S.UserAnswerScroll>
      {answers.map((answerItem, index) => (
        <S.UserAnswerContentList 
          key={index}
          value={answerItem.content}
          readOnly // 이미 제출된 답변 내용 표시, 수정 불가
        />
      ))}
    </S.UserAnswerScroll>
    {!isAnswering && (
      <S.AnswerPlusBtn onClick={handleAnswerClick}>답변하기</S.AnswerPlusBtn>
    )}
  </S.UserAnswerContainer>
) : isAnswering ? (
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
      <S.AnswerSubmitBtn onClick={handleAnswerSubmit}>답변 제출</S.AnswerSubmitBtn>
    </S.AnswerBB>
  </S.UserAnswerBlock>
) : (
  <div>답변을 기다리는 중...</div>
)}

    </S.Container>
  );
}

export default Content;