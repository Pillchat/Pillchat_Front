'use client'

import React, { useState } from "react";
import HeaderNon from "../components/Header_Non";
import * as S from "../styles/Signin"
import axios from "axios";
import { useRouter } from "next/navigation";

function Signin(){
    const [idValue, setIdValue] = useState("");
    const [passwordValue, setPasswordValue] = useState("");
    const router = useRouter();

    function handleIdChange(e: React.ChangeEvent<HTMLInputElement>){
        setIdValue(e.target.value);
    };
    
    function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>){
       setPasswordValue(e.target.value);
    };

    const handleSubmit = async (e: React.MouseEvent<HTMLDivElement>) => {
        const dto = {
            username: idValue,
            password: passwordValue
        }

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/auth/login`, dto, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
                
            );
            if (response.status === 200) {
                router.push("/");
            }
        } catch (error) {
            console.log("회원가입 실패:", error);
        }
    };

    return(
        <S.Container>
            <HeaderNon />
            <S.PageTitle>로그인</S.PageTitle>

            <S.LoginBox>
                <S.ContainBox>
                    <S.ContainTitle>아이디</S.ContainTitle>
                    <S.ContainInput onChange={handleIdChange} placeholder="아이디를 적어주세요." />
                </S.ContainBox>

                <S.ContainBox>
                    <S.ContainTitle>비밀번호</S.ContainTitle>
                    <S.ContainInput onChange={handlePasswordChange} placeholder="비밀번호를 적어주세요." />
                </S.ContainBox>

                <S.AutoBox>
                    <S.AutoLog>
                        <S.Check />
                        <S.ContainTitle>자동 로그인</S.ContainTitle>
                    </S.AutoLog>
                    <S.ContainDes>아이디와 비밀번호를 기억합니다.</S.ContainDes>
                </S.AutoBox>

                <S.LogBtn onClick={handleSubmit}>로그인</S.LogBtn>
            </S.LoginBox>
        </S.Container>
    );
}

export default Signin;