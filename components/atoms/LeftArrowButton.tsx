import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export const LeftArrowButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      variant="textOnly"
      size="icon"
      onClick={onClick}
      aria-label="이전 화면"
      className="[&_svg]:size-5"
    >
      <ArrowLeft aria-hidden="true" />
    </Button>
  );
};
