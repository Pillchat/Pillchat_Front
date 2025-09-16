// "use client";

// import { FC, useRef, useState, ChangeEvent } from "react";
// import { CustomHeader, IconInputField } from "@/components/molecules";
// import { ProfileImg, SolidButton, Toast } from "@/components/atoms";
// import { nicknameAtom, profileImgAtom } from "@/store/profile";
// import { useAtom } from "jotai";

// const editprofile: FC = () => {
//   const [nickname, setNickname] = useAtom(nicknameAtom);
//   const [profileImg, setProfileImg] = useAtom(profileImgAtom);
//   const [open, setOpen] = useState(false);

//   const fileInputRef = useRef<HTMLInputElement | null>(null);

//   const handleProfileImgClick = () => {
//     fileInputRef.current?.click();
//   };

//   const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const imgUrl = URL.createObjectURL(file);
//       setProfileImg(imgUrl);
//     }
//   };

//   const handleSaveNickname = () => {
//     if (nickname.trim().length < 2) {
//       alert("닉네임은 최소 2자리 이상이어야 합니다.");
//       return;
//     }
//     setNickname(nickname);
//     setOpen(true);
//   };

//   return (
//     <div className="flex min-h-screen flex-col items-center">
//       <CustomHeader title="프로필 편집" />

//       {/* 프로필 영역 */}
//       <div className="mt-7 flex w-full flex-col items-center justify-center gap-4">
//         {profileImg ? (
//           <img
//             src={profileImg}
//             alt="프로필"
//             className="h-[4.25rem] w-[4.25rem] rounded-full border-[0.2rem] border-brand object-cover"
//           />
//         ) : (
//           <ProfileImg />
//         )}

//         <div
//           onClick={handleProfileImgClick}
//           className="h-auto w-auto cursor-pointer rounded-3xl bg-muted px-5 py-3 text-button-foreground"
//         >
//           프로필 이미지 변경
//         </div>

//         <input
//           type="file"
//           accept="image/*"
//           ref={fileInputRef}
//           onChange={handleFileChange}
//           className="hidden"
//         />
//       </div>

//       <div className="mt-5 flex w-[90%] flex-col gap-[5px]">
//         <IconInputField
//           content="닉네임"
//           iconAsButton={true}
//           inputValue={nickname}
//           onChange={(e) => setNickname(e.target.value)}
//           onIconClick={() => setNickname("")}
//           iconPosition="right"
//           iconSrc="Cancel.svg"
//           iconSize="20"
//           placeholder="닉네임을 적어주세요"
//           autoFocus={true}
//         />

//         <p className="font-regular text-sm text-border">
//           영어, 숫자를 조합한 최소 2자리
//         </p>
//       </div>

//       <div className="fixed bottom-8 w-[90%]">
//         <SolidButton content="변경" onClick={handleSaveNickname} />
//       </div>

//       <Toast
//         open={open}
//         onClose={() => setOpen(false)}
//         message="변경이 완료되었습니다."
//         duration={2500}
//       />
//     </div>
//   );
// };

// export default editprofile;

"use client";

import { useAtom } from "jotai";
import { profileImgAtom, nicknameAtom } from "@/store/profile";
import { useState, useRef, ChangeEvent } from "react";
import { CustomHeader, IconInputField } from "@/components/molecules";
import { ProfileImg, SolidButton, Toast } from "@/components/atoms";

const EditProfile = () => {
  // 서버 저장용 전역 상태
  const [serverProfileImg, setServerProfileImg] = useAtom(profileImgAtom);
  const [serverNickname, setServerNickname] = useAtom(nicknameAtom);

  // 임시 상태
  const [tempProfileImg, setTempProfileImg] = useState<string | null>(
    serverProfileImg,
  );
  const [tempNickname, setTempNickname] = useState(serverNickname);
  const [open, setOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProfileImgClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file); // 프리뷰
      setTempProfileImg(imgUrl);
    }
  };

  const handleSave = async () => {
    if (tempNickname.trim().length < 2) {
      alert("닉네임은 최소 2자리 이상이어야 합니다.");
      return;
    }

    const formData = new FormData();
    formData.append("nickname", tempNickname);
    if (fileInputRef.current?.files?.[0]) {
      formData.append("profileImg", fileInputRef.current.files[0]);
    }

    const res = await fetch("/api/profile", {
      method: "PATCH",
      body: formData,
    });

    if (res.ok) {
      setServerNickname(tempNickname);
      setServerProfileImg(tempProfileImg ?? "");
      setOpen(true);
    } else {
      alert("프로필 저장 실패");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center">
      <CustomHeader title="프로필 편집" />

      {/* ProfileImg 컴포넌트 재사용 */}
      <div className="mt-7 flex w-full flex-col items-center gap-4">
        <ProfileImg src={tempProfileImg} />

        <div
          onClick={handleProfileImgClick}
          className="cursor-pointer rounded-3xl bg-muted px-5 py-3"
        >
          프로필 이미지 변경
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* 닉네임 */}
      <div className="mt-5 flex w-[90%] flex-col gap-[5px]">
        <IconInputField
          content="닉네임"
          inputValue={tempNickname}
          onChange={(e) => setTempNickname(e.target.value)}
          onIconClick={() => setTempNickname("")}
          placeholder="닉네임을 적어주세요"
        />
      </div>

      <div className="fixed bottom-8 w-[90%]">
        <SolidButton content="변경" onClick={handleSave} />
      </div>

      <Toast
        open={open}
        onClose={() => setOpen(false)}
        message="변경이 완료되었습니다."
        duration={2500}
      />
    </div>
  );
};

export default EditProfile;
