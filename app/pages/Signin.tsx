    'use client';

    import React, { useState, useEffect } from "react";
    import HeaderNon from "../components/Header_Non";
    import * as S from "../styles/Signin";
    import axios from "axios";
    import { useRouter } from "next/navigation";
    import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';

    function Signin() {
    const [idValue, setIdValue] = useState("");
    const [passwordValue, setPasswordValue] = useState("");
    const [token, setToken] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const JWT_EXPIRY_TIME = 24 * 3600 * 1000; // 24시간

    function handleIdChange(e: React.ChangeEvent<HTMLInputElement>) {
        setIdValue(e.target.value);
    }

    function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        setPasswordValue(e.target.value);
    }
    
    const autoLogin = async () => {
        const storedRefreshToken = localStorage.getItem("refreshToken");
    
        if (!storedRefreshToken) {
            console.log("Refresh token 없음. 자동 로그인 생략.");
            return;
        }
    
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/auth/refresh-token`,
                { refreshToken: storedRefreshToken },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );
    
            console.log("자동 로그인 응답 데이터:", response.data); // 디버깅용 로그
            const { access_token, refreshToken } = response.data;
    
            if (access_token && refreshToken) {
                localStorage.setItem("access_token", access_token);
                localStorage.setItem("refreshToken", refreshToken);
    
                setTimeout(() => onSilentRefresh(access_token), JWT_EXPIRY_TIME - 60000);
                router.push("/");
            } else {
                console.error("자동 로그인 응답에 토큰 데이터가 없습니다.");
            }
        } catch (error) {
            console.error("자동 로그인 실패:", error);
        }
    };
    
    

        useEffect(() => {
            autoLogin(); // 페이지 로드 시 자동 로그인 시도
            setIsClient(true);
        }, []);

        if (!isClient) return null;

        const handleSubmit = async () => {
            const dto = {
                username: idValue,
                password: passwordValue,
            };
        
            try {
                const response = await axios.post(
                    `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/auth/login`,
                    dto,
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                        withCredentials: true,
                    }
                );
        
                const { access_token, refreshToken } = response.data;
        
                if (access_token && refreshToken) {
                    localStorage.setItem("access_token", access_token);
                    localStorage.setItem("refreshToken", refreshToken);
        
                    setTimeout(() => onSilentRefresh(access_token), JWT_EXPIRY_TIME - 60000);
                    router.push("/");
                } else {
                    console.error("로그인 응답에 토큰 데이터가 없습니다.");
                }
            } catch (error) {
                console.error("로그인 실패:", error);
            }
        };        

        const onSilentRefresh = async (refreshToken: string) => {
            try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/auth/refresh-token`,
                { refreshToken : refreshToken },
                {
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true,
                }
            );

            if (response.status === 200) {
                const { access, refresh } = response.data;

                localStorage.setItem("access_token", access);
                localStorage.setItem("refreshToken", refresh);

                setTimeout(() => onSilentRefresh(refreshToken), JWT_EXPIRY_TIME - 60000);
            }
            } catch (error: any) {
            console.error("토큰 갱신 실패:", error);
            }
        };

    return (
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
            <S.ContainInput
                onChange={handlePasswordChange}
                placeholder="비밀번호를 적어주세요."
                type={showPassword ? "text" : "password"}
            />
            <S.IconWrapper onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <AiFillEyeInvisible size={24} /> : <AiFillEye size={24} />}
            </S.IconWrapper>
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

        <S.Gosignup onClick={() => router.push("/Signup")}>회원가입 하러 가기</S.Gosignup>
        </S.Container>
    );
    }

    export default Signin;