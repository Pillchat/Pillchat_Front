import { useState } from "react";
import { PlusCircle } from "lucide-react";
import * as S from "../styles/StepForm";

interface Step {
  id: number;
  text: string;
  image?: File | null;
}

export default function StepForm() {
  const [steps, setSteps] = useState<Step[]>([{ id: 1, text: "" }]);

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

  const handleSubmit = () => {
    console.log("등록된 답변:", steps);
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