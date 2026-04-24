"use client";

import { FC, useState, useEffect } from "react";
import { useRouter } from "@/lib/navigation";
import { RankIndicator } from "@/components/atoms";
import { InfoHeader, GeneralModal } from "@/components/molecules";
import { usePromotion } from "./_hooks/usePromotion";

const grade: FC = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { fetchPromotion, promotionData, isLoading, error } = usePromotion();

  useEffect(() => {
    fetchPromotion();
  }, [fetchPromotion]);

  // 승급 조건 달성 여부 확인
  const isPromotionAchieved =
    (promotionData?.progress || 0) >= (promotionData?.target || 100);

  return (
    <div className="flex min-h-screen flex-col items-center">
      <InfoHeader
        title="승급 정보"
        infoIconSrc="/Info.svg"
        infoIconSize="2rem"
        infoIconOnClick={() => router.push("/gradeInfo")}
        isActive
      />

      <div className="flex w-[90%] flex-col items-center justify-center">
        <p className="text-2xl font-bold">현재 내 등급</p>
        <div className="mt-3">
          <RankIndicator
            currentRank={
              promotionData?.currentGrade?.toLowerCase() || "saessak"
            }
          />

          <div className="mt-6 flex flex-col">
            <div className="flex flex-row items-center gap-1">
              <img src={"/UncheckedIcon.svg"} />
              <p>매월 1일 추가 답변 열람권 2장 증정!</p>
            </div>

            <div className="flex flex-row items-center gap-1">
              <img src={"/UncheckedIcon.svg"} />
              <p>학습자료 구매권 10% 할인 쿠폰 1장 증정!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 h-[1rem] w-full bg-[#FFF6F5]" />
      <p className="mt-10 text-2xl font-bold">다음 승급 조건</p>

      <div className="mt-5 flex w-[90%] flex-row items-center justify-between gap-1">
        <div className="flex flex-row items-center gap-1">
          <img
            src={isPromotionAchieved ? "/CheckedIcon.svg" : "/UncheckIcon.svg"}
          />
          <p style={{ color: isPromotionAchieved ? "#FF412E" : "inherit" }}>
            질문 및 답변 합산 100개 이상
          </p>
        </div>
        <p
          style={{ color: isPromotionAchieved ? "#FF412E" : "inherit" }}
          className={!isPromotionAchieved ? "text-muted-foreground" : ""}
        >
          {promotionData?.progress || 0} / {promotionData?.target || 100}
        </p>
      </div>

      <div className="mt-4 flex w-full flex-col items-center text-sm text-muted-foreground">
        <p>· 각 승급 조건 중 하나를 달성하면 다음 등급으로 승급합니다.</p>
        <p>· 회원 등급은 매일 00시에 자동 갱신됩니다.</p>
      </div>

      <GeneralModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
        }}
        title="축하합니다!"
        message="'고수' 등급으로 등업하셨어요!
                        앞으로 더 열심히 활동하셔서
                        높은 등급을 노려보세요!"
      />
    </div>
  );
};

export default grade;
