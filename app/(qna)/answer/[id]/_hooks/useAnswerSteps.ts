import { useState, useCallback } from "react";

export type AnswerStep = {
  id: string;
  content: string;
  images?: string[];
};

export const useAnswerSteps = () => {
  const [steps, setSteps] = useState<AnswerStep[]>([
    { id: "1", content: "", images: [] },
  ]);

  const addStep = useCallback(() => {
    const newStep: AnswerStep = {
      id: new Date().toString(),
      content: "",
      images: [],
    };
    setSteps((prev) => [...prev, newStep]);
  }, []);

  const updateStep = useCallback((id: string, updates: Partial<AnswerStep>) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, ...updates } : step)),
    );
  }, []);

  const removeStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== id));
  }, []);

  return {
    steps,
    addStep,
    updateStep,
    removeStep,
  };
};
