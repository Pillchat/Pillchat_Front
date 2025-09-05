import React from "react";
import { useAtom } from "jotai";
import { profileImgAtom } from "@/store/profile";

const ranks = [
  { id: "saessak", label: "새싹", color: "#4CAF50" },
  { id: "hanal", label: "한알", color: "#00BCD4" },
  { id: "dual", label: "두알", color: "#FFCC00" },
  { id: "gosu", label: "고수", color: "#FF412E" },
  { id: "myungyak", label: "명약", color: "#C71200" },
];

interface RankIndicatorProps {
  currentRank: string;
}

export const RankIndicator: React.FC<RankIndicatorProps> = ({
  currentRank,
}) => {
  const [profileImg] = useAtom(profileImgAtom);
  const currentIndex = ranks.findIndex((r) => r.id === currentRank);

  const visibleRanks = [
    ranks[currentIndex - 1] || null,
    ranks[currentIndex],
    ranks[currentIndex + 1] || null,
  ];

  return (
    <div className="flex items-center gap-10">
      {visibleRanks.map((rank, idx) => {
        if (!rank) return <div key={idx} className="h-20 w-20" />;
        const isActive = rank.id === currentRank;

        return (
          <div
            key={rank.id}
            className="flex flex-col items-center transition-transform duration-300"
            style={{
              transform: isActive ? "scale(1.1)" : "scale(0.9)",
              opacity: isActive ? 1 : 0.4,
            }}
          >
            {/* 프로필 이미지 */}
            <div
              className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-200"
              style={{
                border: `4px solid ${rank.color}`,
              }}
            >
              {profileImg ? (
                <img
                  src={profileImg}
                  alt="user profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-500">No Img</span>
              )}
            </div>

            {/* 레이블 (등급 배지) */}
            <div
              className="mt-2 rounded-full px-4 py-1 text-lg"
              style={{
                backgroundColor: isActive ? rank.color : `${rank.color}33`,
                color: isActive ? "white" : rank.color,
              }}
            >
              {rank.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
