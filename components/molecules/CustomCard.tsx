import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FC } from "react";

type CustomCardProps = {
  title: string;
  children: React.ReactNode;
};

export const CustomCard: FC<CustomCardProps> = ({ title, children }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-0 pt-[0.625rem]">
        {children}
      </CardContent>
    </Card>
  );
};
