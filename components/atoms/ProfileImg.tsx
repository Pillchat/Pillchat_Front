import { PUBLIC_ASSETS } from "@/constants/assets";
import { FC } from "react";

interface ProfileImgProps {
  src?: string | null;
}

const DEFAULT_PROFILE_IMAGE = PUBLIC_ASSETS.illustrations.defaultProfile;

export const ProfileImg: FC<ProfileImgProps> = ({ src }) => {
  const imgSrc = src || DEFAULT_PROFILE_IMAGE;

  return (
    <div className="h-[4.25rem] w-[4.25rem] overflow-hidden rounded-full border-[0.2rem] border-brand">
      <img
        src={imgSrc}
        className="h-full w-full object-cover"
        alt="profile"
        onError={(event) => {
          if (
            event.currentTarget.getAttribute("src") !== DEFAULT_PROFILE_IMAGE
          ) {
            event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
          }
        }}
      />
    </div>
  );
};
