import { useState } from "react";

export enum Step {
  Guide = 1,
  Upload,
  Complete,
}

export const useStep = () => {
  const [step, setStep] = useState<Step>(Step.Upload);

  const nextStep = () => {
    if (step < Step.Complete) setStep((prev) => (prev + 1) as Step);
  };

  const prevStep = () => {
    if (step > Step.Upload) setStep((prev) => (prev - 1) as Step);
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
