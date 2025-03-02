"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface HeartContextType {
  heartData: Record<string, { count: number; isHearted: boolean }>;
  toggleHeart: (questionId: string) => void;
}

const HeartContext = createContext<HeartContextType | undefined>(undefined);

export const HeartProvider = ({ children }: { children: ReactNode }) => {
  const [heartData, setHeartData] = useState<Record<string, { count: number; isHearted: boolean }>>({});

  useEffect(() => {
    // 로컬 스토리지에서 기존 좋아요 데이터 가져오기
    const storedHeartData = localStorage.getItem("heartData");
    if (storedHeartData) {
      setHeartData(JSON.parse(storedHeartData));
    }
  }, []);

  const toggleHeart = async (questionId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Access token이 없습니다.");
        return;
      }

      const url = `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions/${questionId}/like`;

      setHeartData((prev) => {
        const currentData = prev[questionId] || { count: 0, isHearted: false };
        const newIsHearted = !currentData.isHearted;
        const newCount = newIsHearted ? currentData.count + 1 : currentData.count - 1;

        return {
          ...prev,
          [questionId]: { count: newCount, isHearted: newIsHearted },
        };
      });

      if (heartData[questionId]?.isHearted) {
        await axios.delete(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420",
          },
          withCredentials: true,
        });
      } else {
        await axios.post(url, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420",
          },
        });
      }

      // 로컬 스토리지에 업데이트된 데이터 저장
      localStorage.setItem("heartData", JSON.stringify(heartData));
    } catch (error) {
      console.error("Axios 오류:", error);
    }
  };

  return (
    <HeartContext.Provider value={{ heartData, toggleHeart }}>
      {children}
    </HeartContext.Provider>
  );
};

export const useHeart = () => {
  const context = useContext(HeartContext);
  if (!context) {
    throw new Error("HeartProvider가 감싸져 있지 않습니다.");
  }
  return context;
};
