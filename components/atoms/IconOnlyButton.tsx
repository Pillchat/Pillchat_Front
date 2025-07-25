import { Button } from "@/components/ui/button";
import { FC, ReactNode } from "react";

export const IconOnlyButton: FC<{
  icon: ReactNode;
  onClick: () => void;
}> = ({ icon, onClick }) => {
  return (
    <Button variant="textOnly" size="icon" onClick={onClick} className="!mt-0">
      {icon}
    </Button>
  );
};
