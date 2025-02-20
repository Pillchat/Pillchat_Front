'use client'

import { createContext, useContext, useState, ReactNode } from "react";

type Rank = "bronze" | "silver" | "gold" | "platinum" | "Diamond";

interface RankContextType {
  rank: Rank;
  setRank: (rank: Rank) => void;
}

const RankContext = createContext<RankContextType | undefined>(undefined);

export const RankProvider = ({ children }: { children: ReactNode }) => {
  const [rank, setRank] = useState<Rank>("bronze"); // 기본 등급 설정

  return (
    <RankContext.Provider value={{ rank, setRank }}>
      {children}
    </RankContext.Provider>
  );
};

export const useRank = () => {
  const context = useContext(RankContext);
  if (!context) {
    throw new Error("useRank must be used within a RankProvider");
  }
  return context;
};
