"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useSubjects } from "@/hooks";
import { fetchAPI } from "@/lib/functions";

export type UploadFormData = {
  title: string;
  subject: string;
  subjectId: string;
  content: string;
};

type UseUploadFormParams = {
  onSubmit?: (data: UploadFormData) => Promise<void> | void;
};

const DEFAULT_VALUES: UploadFormData = {
  title: "",
  subject: "",
  subjectId: "",
  content: "",
};

export const usePostForm = ({ onSubmit }: UseUploadFormParams = {}) => {
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
  const content = watch("content");

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

  const handleSubjectToggle = useCallback(
    (subject: string) => {
      setValue("subject", subject, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      setValue("subjectId", "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [setValue],
  );

  const handleContentChange = useCallback(
    (value: string) => {
      setValue("content", value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue],
  );

  const setFormValues = useCallback(
    (values: Partial<UploadFormData>) => {
      if (values.title !== undefined) {
        setValue("title", values.title, {
          shouldValidate: true,
          shouldDirty: false,
        });
      }
      if (values.subject !== undefined) {
        setValue("subject", values.subject, {
          shouldValidate: true,
          shouldDirty: false,
        });
      }
      if (values.subjectId !== undefined) {
        setValue("subjectId", values.subjectId, {
          shouldValidate: true,
          shouldDirty: false,
        });
      }
      if (values.content !== undefined) {
        setValue("content", values.content, {
          shouldValidate: true,
          shouldDirty: false,
        });
      }
    },
    [setValue],
  );

  const handleUpload = handleSubmit(async (formData) => {
    try {
      setIsSubmitting(true);
      await onSubmit?.({
        title: formData.title.trim(),
        subject: formData.subject,
        subjectId: formData.subjectId,
        content: formData.content.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  const resetForm = useCallback(() => {
    reset(DEFAULT_VALUES);
  }, [reset]);

  return {
    control,
    errors,
    selectedSubject,
    title,
    content,
    handleSubjectToggle,
    handleContentChange,
    handleUpload,
    resetForm,
    isValid,
    isSubmitting,
    setFormValues,
  };
};
