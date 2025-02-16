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

  const handleAddStep = () => {
    setSteps([...steps, { id: steps.length + 1, text: "" }]);
  };

  const handleChange = (id: number, value: string) => {
    setSteps(steps.map(step => (step.id === id ? { ...step, text: value } : step)));
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

      const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers/${questionId}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
        withCredentials: true,
      });

      setAnswers(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios 오류:", error.response?.data || error.message);
      } else {
        console.error("알 수 없는 오류:", error);
      }
    }
  };

  const handleImageUpload = (id: number, file: File | null) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === id ? { ...step, image: file } : step
      )
    );
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.error("Access token이 없습니다.");
      return;
    }

    try {
      const formData = new FormData();
      const content = steps.map(step => step.text).join("\n\n");
      formData.append("content", content);
      formData.append("questionId", questionId || "");
      formData.append("isAnonymous", JSON.stringify(false));

      // ✅ 기존 `images_1`, `images_2` 방식이 아니라, `images[]` 배열 형식으로 추가
      steps.forEach((step) => {
        if (step.image) {
          formData.append("images", step.image); // ✅ "images[]" 배열로 전송하여 백엔드와 정상 매칭
        }
      });

      const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/answers`;

      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      console.log("답변 제출 성공:", response.data);

      // 상태 초기화
      fetchAnswerStatus(Number(questionId));
      setHasAnswer(true);
      setIsAnswering(false);
      setAnswer("");
      setSteps([{ id: 1, text: "" }]);

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