import { useState } from "react";

export enum Step {
  Role = 1,
  Guide,
  Ocr,
  DepartMent,
  ServiceRule,
  PrivacyPolicy,
  Email,
  Password,
  Nickname,
}

export const useStep = () => {
  const [step, setStep] = useState<Step>(Step.DepartMent);

  const nextStep = () => {
    if (step < Step.Password) setStep((prev) => (prev + 1) as Step);
  };

  const prevStep = () => {
    if (step > Step.DepartMent) setStep((prev) => (prev - 1) as Step);
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
