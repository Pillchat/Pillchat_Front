"use client";

import { TextInput } from "@/components/atoms";
import { SectionWithChips } from "@/components/molecules";
import {
  DAYLIST,
  PROFESSIONAL_ROLE,
  REGISTRATION_STATUS,
  TIMELIST,
} from "@/constants";
import { filter, includes } from "lodash";
import { useState } from "react";

export const SelectPersonalInfo = ({ role }: { role: string }) => {
  const [selectedRegistrationStatus, setSelectedRegistrationStatus] = useState<
    string[]
  >([]);
  const [age, setAge] = useState<string>("");
  const [workplace, setWorkplace] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string[]>([]);

  const handleRegistrationStatusToggle = (status: string) => {
    setSelectedRegistrationStatus([status]);
  };

  const handleStudyDayToggle = (day: string) => {
    setSelectedDay((prev) => {
      if (includes(prev, day)) {
        return filter(prev, (d) => d !== day);
      } else if (prev.length < 7) {
        return [...prev, day];
      }
      return prev;
    });
  };

  const handleStudyTimeToggle = (time: string) => {
    setSelectedTime((prev) => {
      if (includes(prev, time)) {
        return filter(prev, (t) => t !== time);
      } else if (prev.length < 4) {
        return [...prev, time];
      }
      return prev;
    });
  };

  return (
    <>
      <p className="my-5 text-xl font-semibold">
        {"name"}님의
        <br />
        맞춤형 서비스를 위한 정보를 입력해주세요.
      </p>
      <div className="flex flex-col gap-8">
        <SectionWithChips
          data={
            role === "student"
              ? {
                  "재적 상태": REGISTRATION_STATUS,
                }
              : {
                  직업: PROFESSIONAL_ROLE,
                }
          }
          selectedItems={selectedRegistrationStatus}
          onItemToggle={handleRegistrationStatusToggle}
          selectionMode="single"
        />
        {role === "student" ? (
          <TextInput
            label="나이"
            placeholder="나이를 입력해주세요."
            value={age}
            onChange={(e) => {
              setAge(e.target.value);
            }}
          />
        ) : (
          <TextInput
            label="근무지명"
            placeholder="근무지명을 입력해주세요."
            value={workplace}
            onChange={(e) => {
              setWorkplace(e.target.value);
            }}
          />
        )}
        <SectionWithChips
          data={
            role === "student"
              ? {
                  "주로 공부하는 요일": DAYLIST,
                }
              : {
                  "주로 사용하는 요일": DAYLIST,
                }
          }
          selectedItems={selectedDay}
          onItemToggle={handleStudyDayToggle}
          maxSelection={7}
          buttonSize="square"
        />
        <SectionWithChips
          data={
            role === "student"
              ? {
                  "주로 공부하는 시간": TIMELIST,
                }
              : {
                  "주로 답변할 시간": TIMELIST,
                }
          }
          selectedItems={selectedTime}
          onItemToggle={handleStudyTimeToggle}
          maxSelection={4}
          buttonSize="long"
        />
      </div>
    </>
  );
};
