// import { FC } from "react";
// import { useAtom } from "jotai";
// import { profileImgAtom } from "@/store/profile";

// export const ProfileImg: FC = () => {
//   const [profileImg] = useAtom(profileImgAtom);

//   const isBlobUrl = profileImg && profileImg.startsWith("blob:");

//   // profileImg가 없거나 빈값일 경우 기본 이미지 사용
//   const imgSrc = profileImg
//     ? isBlobUrl
//       ? profileImg
//       : `/${profileImg}.png`
//     : "/defaultProfile.svg"; // ✅ fallback 이미지

//   return (
//     <div className="h-[4.25rem] w-[4.25rem] overflow-hidden rounded-full border-[0.2rem] border-brand">
//       <img
//         src={imgSrc}
//         className="h-full w-full object-cover"
//         alt="profile"
//       />
//     </div>
//   );
// };

import { FC } from "react";

interface ProfileImgProps {
  src?: string | null;
}

export const ProfileImg: FC<ProfileImgProps> = ({ src }) => {
  const isBlobUrl = src && src.startsWith("blob:");

  const imgSrc = src
    ? isBlobUrl
      ? src
      : `/${src}.png` // 서버에 저장된 경우의 예시 규칙
    : "/defaultProfile.svg"; // fallback

  return (
    <div className="h-[4.25rem] w-[4.25rem] overflow-hidden rounded-full border-[0.2rem] border-brand">
      <img src={imgSrc} className="h-full w-full object-cover" alt="profile" />
    </div>
  );
};
