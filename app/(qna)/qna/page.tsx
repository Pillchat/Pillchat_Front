"use client";

import {
  BottomNavbar,
  GeneralHeader,
  TabsWithUnderline,
} from "@/components/molecules";
import { FC } from "react";

const TABS = [
  { value: "awaiting", label: "답변을 기다리는 질문" },
  { value: "answered", label: "답변이 달린 질문" },
];

const QnaPage: FC = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <GeneralHeader />
      <div className="mx-6">
        <TabsWithUnderline tabs={TABS} defaultValue={TABS[0].value} />
      </div>
      <BottomNavbar />
    </div>
  );
};

export default QnaPage;
