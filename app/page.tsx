"use client";

import { FC } from "react";
import { BottomNavbar, GeneralHeader } from "@/components/molecules";
import { redirect } from "next/navigation";
import { useLocalStorage } from "@/hooks";

const Home: FC = () => {
  const { getStorageItem } = useLocalStorage();

  if (!getStorageItem("access_token")) {
    return redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GeneralHeader />
      <div className="mx-6">{/* TODO: 홈 화면 컴포넌트 추가 */}</div>
      <BottomNavbar />
    </div>
  );
};

export default Home;
