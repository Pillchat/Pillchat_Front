"use client";

import { FC } from "react";
import { Toggle } from "@/components/atoms";
import { CustomHeader } from "@/components/molecules";
import { useAtom } from "jotai";
import {
  answerNotificationAtom,
  adoptNotificationAtom,
  subjectQuestionAtom,
  subjectMaterialAtom,
  adNotificationAtom,
  nightAdNotificationAtom,
} from "@/store/notificationSetting";

const BellSetting: FC = () => {
  const [answerNotification, setAnswerNotification] = useAtom(
    answerNotificationAtom,
  );
  const [adoptNotification, setAdoptNotification] = useAtom(
    adoptNotificationAtom,
  );
  const [subjectQuestion, setSubjectQuestion] = useAtom(subjectQuestionAtom);
  const [subjectMaterial, setSubjectMaterial] = useAtom(subjectMaterialAtom);
  const [adNotification, setAdNotification] = useAtom(adNotificationAtom);
  const [nightAdNotification, setNightAdNotification] = useAtom(
    nightAdNotificationAtom,
  );

  return (
    <div className="flex min-h-screen flex-col items-center">
      <CustomHeader title="알림 설정" />

      <div className="mt-3 flex w-[90%] flex-col gap-8">
        <div className="flex w-full flex-row justify-between">
          <p>나의 질문에 대한 답변</p>
          <Toggle
            checked={answerNotification}
            onChange={setAnswerNotification}
            ariaLabel="답변 알림 토글"
            size="md"
          />
        </div>

        <div className="flex w-full flex-row justify-between">
          <p>나의 질문에 대한 채택</p>
          <Toggle
            checked={adoptNotification}
            onChange={setAdoptNotification}
            ariaLabel="채택 알림 토글"
            size="md"
          />
        </div>

        <div className="flex w-full flex-row justify-between">
          <p>관심있는 과목의 질문 등록</p>
          <Toggle
            checked={subjectQuestion}
            onChange={setSubjectQuestion}
            ariaLabel="질문 등록 알림 토글"
            size="md"
          />
        </div>

        <div className="flex w-full flex-row justify-between">
          <p>관심있는 과목의 학습자료 등록</p>
          <Toggle
            checked={subjectMaterial}
            onChange={setSubjectMaterial}
            ariaLabel="학습자료 등록 알림 토글"
            size="md"
          />
        </div>
      </div>

      <div id="line" className="mt-8 h-[1px] w-[90%] bg-muted" />

      <div className="mt-8 flex w-[90%] flex-col gap-8">
        <div className="flex w-full flex-row items-center justify-between">
          <div className="flex flex-col">
            <p>광고성 정보 수신 동의</p>
            <p className="text-xs text-button-foreground">
              쿠폰정보, 이벤트, 특가상품 등 알림 설정
            </p>
          </div>
          <Toggle
            checked={adNotification}
            onChange={setAdNotification}
            ariaLabel="광고성 정보 토글"
            size="md"
          />
        </div>

        <div className="flex w-full flex-row items-center justify-between">
          <div className="flex flex-col">
            <p>야간 광고 수신 동의</p>
            <p className="text-xs text-button-foreground">
              21:00 ~ 08:00시에도 광고성 정보를 수신
            </p>
          </div>
          <Toggle
            checked={nightAdNotification}
            onChange={setNightAdNotification}
            ariaLabel="야간 광고 토글"
            size="md"
          />
        </div>
      </div>
    </div>
  );
};

export default BellSetting;
