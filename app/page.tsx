"use client";

import { FC } from "react";
import { BottomNavbar, GeneralHeader } from "@/components/molecules";

const Home: FC = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <GeneralHeader />
      <div className="mx-6">{/* TODO: 홈 화면 컴포넌트 추가 */}</div>
      <BottomNavbar />
    </div>
  );
};

export default Home;
