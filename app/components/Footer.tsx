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
    const pathname = typeof window !== "undefined" ? window.location.pathname : ""; // 현재 경로 확인

    const getIconColor = (path: string) => {
        return pathname === path ? "#FF412E" : "#d9d9d9"; // 현재 경로면 #FF412E, 아니면 기본색 #d9d9d9
    };

    return (
        <S.FooterCover>
            <BsFillPeopleFill size={25} color={getIconColor("/People")} />
            <CiChat2 size={25} color={getIconColor("/Q")} onClick={() => router.push("/Q")} />
            <FaHome size={25} color={getIconColor("/")} onClick={() => router.push("/")} />
            <FaBookOpen size={25} color={getIconColor("/Book")} />
            <CgProfile size={25} color={getIconColor("/Profile")} onClick={() => router.push("/Profile")} />
        </S.FooterCover>
    );
}

export default Footer;
