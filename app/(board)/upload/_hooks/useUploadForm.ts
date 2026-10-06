"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

export type UploadFormData = {
  title: string;
  content: string;
};

type UseUploadFormParams = {
  onSubmit?: (data: UploadFormData) => Promise<void> | void;
};

const DEFAULT_VALUES: UploadFormData = {
  title: "",
  content: "",
};

export const useUploadForm = ({ onSubmit }: UseUploadFormParams = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const title = watch("title");
  const content = watch("content");

  const handleContentChange = (value: string) => {
    setValue("content", value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleUpload = handleSubmit(async (formData) => {
    try {
      setIsSubmitting(true);
      await onSubmit?.({
        title: formData.title.trim(),
        content: formData.content.trim(),
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
    title,
    content,
    handleContentChange,
    handleUpload,
    resetForm,
    isValid,
    isSubmitting,
    setValue,
  };
};
