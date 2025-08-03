import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FC, ReactNode } from "react";
import { CloseButton } from "../atoms/CloseButton";

type CustomCardProps = {
  title: string;
  children: ReactNode;
  onDelete?: () => void;
  showDeleteButton?: boolean;
};

export const CustomCard: FC<CustomCardProps> = ({
  title,
  children,
  onDelete,
  showDeleteButton = false,
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        {showDeleteButton && onDelete && (
          <CloseButton onClick={onDelete} width="32" height="32" />
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-0 pt-[0.625rem]">
        {children}
      </CardContent>
    </Card>
  );
};
