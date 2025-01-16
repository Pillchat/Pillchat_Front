'use client'

import React, { useState, useEffect } from "react";
import HeaderNon from "../components/Header_Non";
import * as S from "../styles/Signin"
import axios from "axios";
import { useRouter } from "next/navigation";

function Signin(){
    const [idValue, setIdValue] = useState("");
    const [passwordValue, setPasswordValue] = useState("");
    const [token, setToken] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();

    const JWT_EXPIRY_TIME = 24 * 3600 * 1000;

    function handleIdChange(e: React.ChangeEvent<HTMLInputElement>){
        setIdValue(e.target.value);
    };
    
    function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>){
       setPasswordValue(e.target.value);
    };

    useEffect(() => {
                    setIsClient(true);
                }, []);
            
    if (!isClient) return null;

    const handleSubmit = async (e: React.MouseEvent<HTMLDivElement>) => {
        const dto = {
            username: idValue,
            password: passwordValue
        }

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/auth/login`, dto, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
                
            );
            if (response.status === 200) {
                const { access, refresh } = response.data;

                localStorage.setItem("access_token", response.data);
                localStorage.setItem("refresh_token", response.data);

                setTimeout(() => onSilentRefresh(access), JWT_EXPIRY_TIME - 60000);
                router.push("/");
            }
        } catch (error) {
            console.log("회원가입 실패:", error);
        }
    };

    // 토큰 갱신
    const onSilentRefresh = async (accessToken: string) => {
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/auth/refresh`,
            { access_token: accessToken },
            {
              headers: {
                "Content-Type": "application/json",
              },
              withCredentials: true,
            }
          );
    
          if (response.status === 200) {
            // 응답 데이터에서 토큰 추출
            const { access, refresh } = response.data; // 최상위 키에서 직접 추출
    
            // localStorage에 토큰 저장
            localStorage.setItem("access_token", access);
            localStorage.setItem("refresh_token", refresh);
    
            // 토큰 갱신 예약 호출
            setTimeout(() => onSilentRefresh(access), JWT_EXPIRY_TIME - 60000);
          }
        } catch (error: any) {
          console.error("Error while refreshing token:", error);
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