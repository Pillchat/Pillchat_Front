import { useAtom } from "jotai";
import { profileImgAtom } from "@/store";

const ranks = [
  { id: "새싹", label: "새싹", color: "#4CAF50" },
  { id: "한알", label: "한알", color: "#00BCD4" },
  { id: "두알", label: "두알", color: "#FFCC00" },
  { id: "고수", label: "고수", color: "#FF412E" },
  { id: "명약", label: "명약", color: "#C71200" },
];

interface RankIndicatorProps {
  currentRank: string;
}

export const RankIndicator: React.FC<RankIndicatorProps> = ({
  currentRank,
}) => {
  const [profileImg] = useAtom(profileImgAtom);
  const currentIndex = ranks.findIndex((r) => r.id.toLowerCase() === currentRank.toLowerCase());

  const visibleRanks = [
    ranks[currentIndex - 1],
    ranks[currentIndex],
    ranks[currentIndex + 1],
  ];

  return (
    <div className="flex items-center gap-10">
      {visibleRanks.map((rank, idx) => {
        if (!rank) return <div key={idx} className="h-20 w-20" />;
        const isActive = rank.id.toLowerCase() === currentRank.toLowerCase();

        return (
          <div
            key={rank.id}
            className={`relative flex h-20 w-20 items-center justify-center rounded-full border-4 transition-all duration-300 ${
              isActive
                ? "border-white shadow-lg"
                : "border-gray-400 opacity-60"
            }`}
            style={{ backgroundColor: rank.color }}
          >
            {isActive && profileImg ? (
              <img
                src={profileImg || "/defaultProfile.svg"}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-white">
                {rank.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};