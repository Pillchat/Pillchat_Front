"use client";

import { TextareaWithLabel, SelectBox } from "@/components/atoms";
import { CustomHeader, SubmitModal } from "@/components/molecules";
import { Button } from "@/components/ui/button";
import { SelectReportTypeModal } from "./modal/page";

import { QUESTION_FORM_RULES } from "@/constants/formValidation";
import { Controller } from "react-hook-form";
import { useReportPage } from "./hooks/useReport";

export default function ReportPage() {
  const {
    control,
    submitReport,
    submitDuplication,
    submitError,
    selectReportType,
    reportTypes,
    selectValue,
    handleSelectChange,
    handleTextareaChange,
    handleSelectFromModal,
    handleReportSubmit,
    openReportType,
    closeReportType,
    closeSubmitReport,
    closeSubmitDuplication,
    closeSubmitError,
    setReportTypes,
  } = useReportPage();

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <CustomHeader title="신고하기" showIcon />

        <div className="flex flex-col sticky bottom-0 mx-6 mb-6 gap-5">
          <SelectBox
            label="신고 유형"
            options={reportTypes.map((type) => ({ key: type, value: type }))}
            selectedValue={selectValue || ""}
            placeholder="신고 유형을 선택해주세요."
            disabled={false}
            handleChange={handleSelectChange}
            onClick={openReportType}
          />

          <Controller
            name="content"
            control={control}
            rules={QUESTION_FORM_RULES.content}
            render={({ field }) => (
              <TextareaWithLabel
                label="신고 내용"
                placeholder="신고 내용을 적어주세요."
                {...field}
                onChange={(e) => handleTextareaChange(e, field.onChange)}
              />
            )}
          />

          <ul className="flex flex-col gap-2 list-disc pl-5 text-[#999999]">
            <li>
              신고 접수 후 패널티 조치까지 영업일 기준 최소 3일에서 최대 5일까지
              소요될 수 있습니다.
            </li>
            <li>
              신고 내용에 대한 사실 관계 확인이 필요할 경우, 필챗 고객경험팀은
              신고자에게 객관적 자료 제출을 요청할 수 있습니다.
            </li>
            <li>
              분쟁을 조정하는 과정에서 신고자와 신고 대상자의 의견이 달라 협의가
              어려운 경우, 필챗 고객경험팀은 중재를 포기하고 회원관리정책에 명시한
              바와 같이 사용자의 활동을 제한할 수 있습니다.
            </li>
          </ul>
        </div>

        <div className="sticky bottom-0 mt-auto mx-6 mb-6">
          <Button
            size="long"
            variant="brand"
            className="h-14 w-full text-lg font-medium"
            onClick={handleReportSubmit}
          >
            제출하기
          </Button>
        </div>

        <SubmitModal
          isOpen={submitReport}
          onClose={closeSubmitReport}
          onConfirm={closeSubmitReport}
          title="제출 완료"
          message1="해당 게시글에 대한 신고가 완료되었습니다."
          message2="감사합니다."
        />
        <SubmitModal
          isOpen={submitDuplication}
          onClose={closeSubmitDuplication}
          onConfirm={closeSubmitDuplication}
          title="중복된 제출"
          message1="이미 접수된 신고입니다."
          message2="감사합니다."
        />
        <SubmitModal
          isOpen={submitError}
          onClose={closeSubmitError}
          onConfirm={closeSubmitError}
          title="제출 오류"
          message1="신고 접수 중 오류가 발생하였습니다."
          message2="잠시 후 다시 시도해주세요."
        />
        {selectReportType && (
          <SelectReportTypeModal
            closeClick={closeReportType}
            onSelect={(label, value) => {
              handleSelectFromModal(label, value);
              closeReportType();
            }}
            setReportTypes={setReportTypes}
          />
        )}
      </div>
    </>
  );
}
