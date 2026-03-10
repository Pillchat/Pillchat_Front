"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useSubjects } from "@/hooks";
import { fetchAPI } from "@/lib/functions";

export type UploadFormData = {
  title: string;
  subject: string;
  subjectId: string;
  reward: string;
};

type UseUploadFormParams = {
  onSubmit?: (data: UploadFormData) => Promise<void> | void;
};

const DEFAULT_VALUES: UploadFormData = {
  title: "",
  subject: "",
  subjectId: "",
  reward: "",
};

export const useUploadForm = ({ onSubmit }: UseUploadFormParams = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getSubjectCodeByLabel } = useSubjects();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<UploadFormData>({
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  const selectedSubject = watch("subject");
  const title = watch("title");
  const reward = watch("reward");

  const { data } = useQuery({
    queryKey: ["subjects", selectedSubject],
    queryFn: () =>
      fetchAPI(
        `/api/subjects/${getSubjectCodeByLabel(selectedSubject)}`,
        "GET",
      ),
    enabled: !!selectedSubject,
  });

  useEffect(() => {
    if (data?.id) {
      setValue("subjectId", data.id, { shouldValidate: true });
    }
  }, [data, setValue]);

  const handleSubjectToggle = (subject: string) => {
    setValue("subject", subject, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setValue("subjectId", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleUpload = handleSubmit(async (formData) => {
    try {
      setIsSubmitting(true);
      await onSubmit?.({
        title: formData.title.trim(),
        subject: formData.subject,
        subjectId: formData.subjectId,
        reward: formData.reward.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  const resetForm = () => {
    reset(DEFAULT_VALUES);
  };

  return {
    control,
    errors,
    selectedSubject,
    title,
    reward,
    handleSubjectToggle,
    handleUpload,
    resetForm,
    isValid,
    isSubmitting,
  };
};