import { FC } from "react";

interface ProfileImgProps {
  src?: string | null;
}

export const ProfileImg: FC<ProfileImgProps> = ({ src }) => {
  const imgSrc = src ?? "/defaultProfile.svg";

  return (
    <div className="h-[4.25rem] w-[4.25rem] overflow-hidden rounded-full border-[0.2rem] border-brand">
      <img src={imgSrc} className="h-full w-full object-cover" alt="profile" />
    </div>
  );
};
