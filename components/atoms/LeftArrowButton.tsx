import { PUBLIC_ASSETS } from "@/constants/assets";
import { Button } from "@/components/ui/button";

export const LeftArrowButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button variant="textOnly" size="icon" onClick={onClick}>
      <img
        src={PUBLIC_ASSETS.icons.chevronLeft}
        alt="arrow-left"
        width={32}
        height={32}
      />
    </Button>
  );
};
