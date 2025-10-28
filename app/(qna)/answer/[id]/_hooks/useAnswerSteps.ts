import { format } from "date-fns";
import { useState, useCallback } from "react";

export type AnswerStep = {
  id: string;
  content: string;
  keys?: string[];
};

export const useAnswerSteps = () => {
  const [steps, setSteps] = useState<AnswerStep[]>([
    { id: "1", content: "", keys: [] },
  ]);

  const addStep = useCallback(() => {
    const newStep: AnswerStep = {
      id: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      content: "",
      keys: [],
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
