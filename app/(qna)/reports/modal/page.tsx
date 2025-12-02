"use client";

import { useEffect } from "react";
import { useReportType } from "../hooks/useReportType";
import { RTM } from "../../../../lib/atoms/RTM";

type SelectReportTypeModalProps = {
  closeClick?: () => void;
  onSelect?: (label: string, value: string) => void;
  setReportTypes: (types: string[]) => void;
};

const REPORT_TYPE_MAP: Record<string, { label: string; value: string }> = RTM;

export function SelectReportTypeModal({ closeClick, onSelect, setReportTypes }: SelectReportTypeModalProps) {
  const { reportTypes, onReportType } = useReportType();

  useEffect(() => {
    const loadReportTypes = async () => {
      await onReportType();
    };
    loadReportTypes();
  }, []);

  useEffect(() => {
    if (reportTypes.length > 0) {
      setReportTypes(reportTypes);
    }
  }, [reportTypes]);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => closeClick?.()}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-h-[100vh] max-w-screen-sm overflow-y-auto rounded-t-2xl border bg-white px-6 pb-6 pt-4 shadow-lg">
        <div className="mt-4 mb-4 flex items-center justify-between">
          <div className="flex flex-col items-center max-w-[80%] mx-auto">
            <p className="text-lg font-medium mb-3">신고 유형</p>
            <p className="text-sm text-gray-400">지식재산권 침해를 신고하는 경우를 제외한</p>
            <p className="text-sm text-gray-400">회원님의 신고는 익명으로 처리됩니다.</p>
          </div>
        </div>
        <hr className="my-2.5"/>
        <div className="flex flex-col gap-3">
          {reportTypes.map((item, i) => {
            const mapped = REPORT_TYPE_MAP[item];
            return (
              <div key={i} className="flex flex-row w-full justify-between">
                <button
                  onClick={() => {
                    onSelect?.(
                      mapped?.label || item,
                      mapped?.value || item
                    )
                  }}
                  className="p-3 text-left rounded-lg"
                >
                  {item}
                </button>
                <img src="/ArrowIcon.svg" alt="arrow-left" width={20} height={20} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}