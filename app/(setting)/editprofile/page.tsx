"use client";

import { useAtom } from "jotai";
import {
  profileImgAtom,
  updateProfileAtom,
  nicknameAtom,
} from "@/store/profile";

import { useState, useRef, ChangeEvent } from "react";
import { CustomHeader, IconInputField } from "@/components/molecules";
import { ProfileImg, SolidButton, Toast } from "@/components/atoms";
import { useRouter } from "next/navigation";
import { uploadProfile } from "@/lib/functions/multipartApi";

const EditProfile = () => {
  const [serverProfileImg] = useAtom(profileImgAtom);
  const [serverNickname] = useAtom(nicknameAtom);

  const [tempProfileImg, setTempProfileImg] = useState<string | null>(
    serverProfileImg,
  );
  const [tempNickname, setTempNickname] = useState(serverNickname || "");
  const [, updateProfile] = useAtom(updateProfileAtom);
  const [open, setOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const handleProfileImgClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      setTempProfileImg(imgUrl);
    }
  };

  const handleSave = async () => {
    if (tempNickname.trim().length < 2) {
      alert("닉네임은 최소 2자리 이상이어야 합니다.");
      return;
    }

    try {
      const file = fileInputRef.current?.files?.[0];
      await uploadProfile(tempNickname.trim(), file);

      updateProfile({
        nickname: tempNickname.trim(),
        profileImg: tempProfileImg ?? serverProfileImg ?? undefined,
      });

      setOpen(true);
      setTimeout(() => {
        router.push("/mypage");
      }, 1000);
    } catch (err: any) {
      alert(err.message || "프로필 저장 실패");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center">
      <CustomHeader title="프로필 편집" />

      <div className="mt-7 flex w-full flex-col items-center gap-4">
        <ProfileImg src={tempProfileImg} />
        <div
          onClick={handleProfileImgClick}
          className="cursor-pointer rounded-3xl bg-muted px-5 py-3 transition-colors hover:bg-muted/80"
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

      <div className="mt-5 flex w-[90%] flex-col gap-[5px]">
        <IconInputField
          content="닉네임"
          value={tempNickname}
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
