"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

type Rank = "bronze" | "silver" | "gold" | "platinum" | "Diamond";

interface RankContextType {
  rank: Rank;
  setRank: (rank: Rank) => void;
}

const RankContext = createContext<RankContextType | undefined>(undefined);

export const RankProvider = ({ children }: { children: ReactNode }) => {
  const [rank, setRank] = useState<Rank>("bronze"); // 기본 등급 설정
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRank = async () => {
      try {
        const response = await axios.get("/api/user-rank");
        setRank(response.data.rank);
      } 
      
      catch (error) {
        console.error("등급 가져오기 오류:", error);
      }
      
      finally {
        setLoading(false);
      }
    };

    fetchUserRank();
  }, []);

  if (loading) return <p>로딩 중...</p>; // 데이터 가져오는 동안 로딩 표시

  return (
    <RankContext.Provider value={{ rank, setRank }}>
      {children}
    </RankContext.Provider>
  );
};

export const useRank = () => {
  const context = useContext(RankContext);
  if (!context) {
    throw new Error("RankProvider 오류");
  }
  return context;
};
