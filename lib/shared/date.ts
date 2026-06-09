import { differenceInHours, differenceInMinutes, format } from "date-fns";

export const formatDiffDate = (date: string) => {
  const getTimeDiff = differenceInHours(new Date(), new Date(date));

  if (getTimeDiff === 0) {
    const getMinDiff = differenceInMinutes(new Date(), new Date(date));
    return `${getMinDiff}분 전`;
  }

  if (getTimeDiff < 24) {
    return `${getTimeDiff}시간 전`;
  }

  return format(date, "yyyy-MM-dd");
};
