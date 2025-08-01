import { useState } from "react";

export enum Step {
  Role = 1,
  Guide,
  Ocr,
  DepartMent,
  ServiceRule,
  Email,
  Password,
  Nickname,
}

export const useStep = () => {
  const [step, setStep] = useState<Step>(Step.Role);

  const nextStep = () => {
    if (step < Step.Nickname) setStep((prev) => (prev + 1) as Step);
  };

  const prevStep = () => {
    if (step > Step.Role) setStep((prev) => (prev - 1) as Step);
  };

  const goToStep = (targetStep: Step) => {
    setStep(targetStep);
  };

  return {
    step,
    setStep: goToStep,
    nextStep,
    prevStep,
  };
};
