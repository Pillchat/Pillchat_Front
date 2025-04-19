import React from "react";
import { useRouter } from "next/navigation";
import * as S from "../styles/Footer";
import { FaHome } from "react-icons/fa";
import { CiChat2 } from "react-icons/ci";
import { BsFillPeopleFill } from "react-icons/bs";
import { FaBookOpen } from "react-icons/fa6";
import { CgProfile } from "react-icons/cg";

function Footer() {
  const router = useRouter();
  const pathname =
    typeof window !== "undefined" ? window.location.pathname || "/" : "/"; // 초기값을 "/"로 설정

  const getIconColor = (path: string) => {
    return pathname === path ? "#FF412E" : "#d9d9d9";
  };

  return (
    <S.FooterCover>
      <BsFillPeopleFill
        size={25}
        color={getIconColor("/geshipan")}
        onClick={() => router.push("/geshipan")}
        onTouchStart={(e) => e.stopPropagation()}
      />
      <CiChat2
        size={25}
        color={getIconColor("/Q")}
        onClick={() => router.push("/Q")}
        onTouchStart={(e) => e.stopPropagation()}
      />
      <FaHome
        size={25}
        color={getIconColor("/")}
        onClick={() => router.push("/")}
        onTouchStart={(e) => e.stopPropagation()}
      />
      <FaBookOpen
        size={25}
        color={getIconColor("/Archaive")}
        onClick={() => router.push("/Archaive")}
        onTouchStart={(e) => e.stopPropagation()}
      />
      <CgProfile
        size={25}
        color={getIconColor("/Profile")}
        onClick={() => router.push("/Profile")}
        onTouchStart={(e) => e.stopPropagation()}
      />
    </S.FooterCover>
  );
}

export default Footer;
