"use client";

import { FC, useEffect, useState } from "react";
import { BottomNavbar, GeneralHeader } from "@/components/molecules";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks";

const Home: FC = () => {
  const router = useRouter();
  const { getStorageItem } = useLocalStorage();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getStorageItem("access_token");
    setIsAuthenticated(!!token);
  }, [getStorageItem]);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
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
