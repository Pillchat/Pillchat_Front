import { PUBLIC_ASSETS } from "@/constants/assets";
export const PharmMoney = ({ reward }: { reward: string }) => {
  return (
    <div className="flex flex-row items-center gap-1">
      <img
        src={PUBLIC_ASSETS.icons.pharmCoin}
        alt="money"
        className="h-5 w-5"
      />
      <span className="text-balance text-base text-brand">{reward || 50}</span>
    </div>
  );
};
