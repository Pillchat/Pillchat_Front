import { useState } from "react";
import { PlusCircle } from "lucide-react";
import * as S from "../styles/StepForm";
import axios from "axios";
import { useSearchParams } from "next/navigation";

interface Step {
  id: number;
  text: string;
  image?: File | null;
}

export default function StepForm() {
  const [steps, setSteps] = useState<Step[]>([{ id: 1, text: "" }]);
  const [answer, setAnswer] = useState(""); // 답변 내용 상태
  const [answers, setAnswers] = useState<any[]>([]); // 여러 답변을 배열로 저장
  const [hasAnswer, setHasAnswer] = useState(false); // 답변 여부 상태
  const [isAnswering, setIsAnswering] = useState(false); // 답변 작성 상태
  const searchParams = useSearchParams(); // URL의 쿼리 파라미터를 가져옴
  const questionId = searchParams.get("questionId"); // questionId 파라미터 가져오기
  const [file, setFile] = useState<File | null>(null); // 이미지 파일 상태

  const handleAddStep = () => {
    setSteps([...steps, { id: steps.length + 1, text: "" }]);
  };

  const handleChange = (id: number, value: string) => {
    setSteps(steps.map(step => (step.id === id ? { ...step, text: value } : step)));
  };

  const handleImageUpload = (id: number, file: File | null) => {
    setSteps(steps.map(step => (step.id === id ? { ...step, image: file } : step)));
  };

  const handleDeleteStep = (id: number) => {
    setSteps(steps.filter(step => step.id !== id));
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

      setAnswers(response.data); // 여러 개의 답변을 상태에 저장
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios 오류:", error.response?.data || error.message);
      } else {
        console.error("알 수 없는 오류:", error);
      }
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("Access token이 없습니다.");
      return;
    }
  
    try {
      const formData = new FormData();
      const content = steps.map(step => step.text).join("\n\n"); // 스텝을 합쳐 저장
      formData.append("content", content);
      formData.append("questionId", questionId || "");
      formData.append("isAnonymous", JSON.stringify(false));
  
      // 이미지가 있는 스텝의 파일 추가
      steps.forEach((step, index) => {
        if (step.image) {
          formData.append(`image_${index + 1}`, step.image);
        }
      });
  
      const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers`;
  
      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
          "Content-Type": "multipart/form-data",
        },
      });
  
      console.log("답변 제출 성공:", response.data);
  
      // 답변 제출 후 상태 초기화
      fetchAnswerStatus(Number(questionId));
      setHasAnswer(true);
      setIsAnswering(false);
      setAnswer(""); // 답변 필드 초기화
      setSteps([{ id: 1, text: "" }]); // 스텝 초기화
  
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios 오류:", error.response?.data || error.message);
      } else {
        console.error("알 수 없는 오류:", error);
      }
    }
  };  

  return (
    <S.Container>
      {steps.map((step, index) => (
        <S.StepBox key={step.id}>
          <S.StepHeader>
            <h3>STEP {index + 1}</h3>
            <S.Icons>
              <label>
                <S.CameraIcon />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleImageUpload(step.id, e.target.files?.[0] || null)}
                />
              </label>
              {steps.length > 1 && (
                <S.TrashIcon onClick={() => handleDeleteStep(step.id)} />
              )}
            </S.Icons>
          </S.StepHeader>
          <S.TextArea
            value={step.text}
            onChange={e => handleChange(step.id, e.target.value)}
            placeholder="답변을 입력하세요..."
          />
        </S.StepBox>
      ))}

      <S.AddStepButton onClick={handleAddStep}>
        <PlusCircle size={18} /> STEP {steps.length + 1} 추가
      </S.AddStepButton>

      <S.SubmitButton onClick={handleSubmit}>답변 등록하기 →</S.SubmitButton>
    </S.Container>
  );
}