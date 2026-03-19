"use client";

import { useState, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useQuestionForm } from "../../ask/_hooks";
import {
  ReportCreateRequest,
  ReportReasonType,
  TargetType,
} from "@/types/report";
import { fetchAPI } from "@/lib/functions";

const useReportModalState = () => {
  const [submitReport, setSubmitReport] = useState(false);
  const [submitDuplication, setSubmitDuplication] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [selectReportType, setSelectReportType] = useState(false);

  const openReportType = () => setSelectReportType(true);
  const closeReportType = () => setSelectReportType(false);

  const openSubmitReport = () => setSubmitReport(true);
  const closeSubmitReport = () => setSubmitReport(false);

  const openSubmitDuplication = () => setSubmitDuplication(true);
  const closeSubmitDuplication = () => setSubmitDuplication(false);

  const openSubmitError = () => setSubmitError(true);
  const closeSubmitError = () => setSubmitError(false);

  return {
    submitReport,
    submitDuplication,
    submitError,
    selectReportType,
    openReportType,
    closeReportType,
    openSubmitReport,
    closeSubmitReport,
    openSubmitDuplication,
    closeSubmitDuplication,
    openSubmitError,
    closeSubmitError,
  };
};

const isValidTargetType = (value: string | null): value is TargetType => {
  return (
    value === "QUESTION" ||
    value === "ANSWER" ||
    value === "USER" ||
    value === "BOARD" ||
    value === "BOARD_COMMENT" ||
    value === "MATERIAL"
  );
};

const useReportFormState = (
  openSubmitReport: () => void,
  openSubmitDuplication: () => void,
  openSubmitError: () => void,
) => {
  const { control } = useQuestionForm();
  const params = useSearchParams();

  const [reportTypes, setReportTypes] = useState<string[]>([]);
  const [selectValue, setSelectValue] = useState("");
  const [selectApiValue, setSelectApiValue] = useState("");
  const [content, setContent] = useState("");

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectValue(event.target.value);
    setSelectApiValue(event.target.value);
  };

  const handleTextareaChange = (
    event: ChangeEvent<HTMLTextAreaElement>,
    onChange: (value: any) => void,
  ) => {
    onChange(event);
    setContent(event.target.value);
  };

  const handleSelectFromModal = (label: string, value: string) => {
    setSelectValue(label);
    setSelectApiValue(value);
  };

  const handleReportSubmit = async () => {
    try {
      const idParam = params.get("id");
      const typeParam = params.get("type");

      if (!selectApiValue) {
        throw new Error("신고 유형을 선택해주세요.");
      }

      if (!idParam) {
        throw new Error("신고 대상 ID가 없습니다.");
      }

      if (!isValidTargetType(typeParam)) {
        throw new Error("신고 대상 유형이 올바르지 않습니다.");
      }

      const targetId = Number(idParam);

      if (Number.isNaN(targetId)) {
        throw new Error("신고 대상 ID가 올바르지 않습니다.");
      }

      const requestBody: ReportCreateRequest = {
        targetType: typeParam,
        targetId,
        reasonType: selectApiValue as ReportReasonType,
        reasonDetail: content || undefined,
      };

      const response = await fetchAPI("/api/reports", "POST", requestBody);
      const result = response.data;

      if (result?.success === false) {
        throw new Error(result?.message || "신고 처리에 실패했습니다.");
      }

      openSubmitReport();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("이미 처리 중인 신고가 존재합니다")) {
          openSubmitDuplication();
        } else {
          openSubmitError();
        }
        console.error("신고 실패:", error);
      } else {
        openSubmitError();
        console.error("신고 실패:", error);
      }
    }
  };

  return {
    control,
    reportTypes,
    setReportTypes,
    selectValue,
    handleSelectChange,
    handleTextareaChange,
    handleSelectFromModal,
    handleReportSubmit,
  };
};

export const useReportPage = () => {
  const modalState = useReportModalState();
  const formState = useReportFormState(
    modalState.openSubmitReport,
    modalState.openSubmitDuplication,
    modalState.openSubmitError,
  );

  return {
    ...modalState,
    ...formState,
  };
};
