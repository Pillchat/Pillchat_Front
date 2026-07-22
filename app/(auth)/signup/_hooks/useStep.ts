import { useCallback, useState } from "react";

export enum Step {
  Role = 1,
  Guide,
  Ocr,
  DepartMent,
  ServiceRule,
  PrivacyPolicy,
  AuthMethod,
  Email,
  Password,
  Nickname,
}

export const useStep = () => {
  const [step, setStep] = useState<Step>(Step.DepartMent);

  const nextStep = useCallback(() => {
    setStep((currentStep) =>
      currentStep < Step.Password ? ((currentStep + 1) as Step) : currentStep,
    );
  }, []);

  const prevStep = useCallback(() => {
    setStep((currentStep) =>
      currentStep > Step.DepartMent ? ((currentStep - 1) as Step) : currentStep,
    );
  }, []);

  const goToStep = useCallback((targetStep: Step) => {
    setStep(targetStep);
  }, []);

  return {
    step,
    setStep: goToStep,
    nextStep,
    prevStep,
  };
};
