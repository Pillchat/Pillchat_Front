import { FC } from "react";
import { useAtom } from "jotai";
import { profileImgAtom } from "@/store/profile";

export const ProfileImg: FC = () => {
  const [profileImg] = useAtom(profileImgAtom);

  const isBlobUrl = profileImg && profileImg.startsWith("blob:");
  const imgSrc = isBlobUrl ? profileImg : `/${profileImg}.png`;

  return (
    <div className="h-[4.25rem] w-[4.25rem] overflow-hidden rounded-full border-[0.2rem] border-brand">
      <img src={imgSrc} className="h-full w-full object-cover" alt="profile" />
    </div>
  );
};
