import { FC } from "react";

export const IconWithCount: FC<{ src: string; count: number }> = ({
  src,
  count,
}) => {
  return (
    <span className="flex flex-row items-center">
      <img src={src} alt="eye" className="h-5 w-5" />
      <span>{count}</span>
    </span>
  );
};
