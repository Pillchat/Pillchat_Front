import { Button } from "@/components/ui/button";

export const LeftArrowButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button variant="textOnly" size="icon" onClick={onClick}>
      <img
        src="/icons/ChevronLeft.svg"
        alt="arrow-left"
        width={32}
        height={32}
      />
    </Button>
  );
};
