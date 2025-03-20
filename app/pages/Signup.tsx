'use client'

import React, { useState, useEffect } from "react";
import * as S from "../styles/Signup";
import HeaderNon from "../components/Header_Non";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';

function Signup() {
    const [schoolValue, setSchoolValue] = useState("");
    const [gradeValue, setGrade] = useState("");
    const [ageValue, setAge] = useState("");
    const [idValue, setId] = useState("");
    const [passwordValue, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [idError, setIdError] = useState<string | null>(null); // 아이디 오류 메시지 상태 추가
    const [isClient, setIsClient] = useState(false);

    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

    // 아이디 변경 시 중복 확인
    const handleIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setId(value);

        // 아이디 중복 검사
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/auth/check-id?username=${value}`
            );
            if (response.data.exists) {
                setIdError("이미 사용 중인 아이디입니다.");
            } else {
                setIdError(null); // 아이디가 중복되지 않으면 오류 메시지 제거
            }
        } catch (error) {
            console.log("아이디 중복 확인 실패:", error);
        }
    };

    function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setPassword(value);

        // 비밀번호 유효성 검사: 최소 1개 특수문자 포함 여부 확인
        const specialCharRegex = /[!@#$%^&*]/;
        if (!specialCharRegex.test(value)) {
            setPasswordError("비밀번호에는 최소 1개의 특수문자(!@#$%^&*)가 포함되어야 합니다.");
        } else {
            setPasswordError(null);
        }
    }

    const handleSubmit = async (e: React.MouseEvent<HTMLDivElement>) => {
        if (passwordError || idError) {
            alert("회원가입 정보가 유효하지 않습니다. 수정해주세요.");
            return;
        }
    
        const dto = {
            school: schoolValue,
            grade: gradeValue,
            age: ageValue,
            username: idValue,
            password: passwordValue,
        };
    
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/auth/register`,
                dto,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "ngrok-skip-browser-warning": "69420",
                    },
                    withCredentials: true,
                }
            );
            if (response.status === 200) {
                router.push("/Signin");
            }
        } catch (error: any) {
            // 409 아이디 중복 오류 처리
            if (error.response && error.response.status === 409) {
                setIdError("*이미 사용 중인 아이디입니다.");
            } else {
                console.log("회원가입 실패:", error);
            }
        }
    };
    

    return (
        <S.Container>
            <HeaderNon />
            <S.PageTitle>회원가입</S.PageTitle>

            <S.InputBox>
                <S.ContainBox>
                    <S.ContainTitle>학교</S.ContainTitle>
                    <S.ContainInputSmall
                        onChange={(e) => setSchoolValue(e.target.value)}
                        placeholder="학교를 적어주세요. (ex. XX대학교)"
                        required
                    />
                </S.ContainBox>

                <S.ContainBox>
                    <S.ContainTitle>학년</S.ContainTitle>
                    <S.ContainSelect
                        onChange={(e) => setGrade(e.target.value)}
                        required
                    >
                        <option value="">학년을 선택하세요.</option>
                        <option value="1">1학년</option>
                        <option value="2">2학년</option>
                        <option value="3">3학년</option>
                        <option value="4">4학년</option>
                        <option value="5">5학년</option>
                        <option value="6">6학년</option>
                        <option value="휴학">휴학</option>
                        <option value="졸업">졸업</option>
                    </S.ContainSelect>
                </S.ContainBox>

                <S.ContainBox>
                    <S.ContainTitle>연령</S.ContainTitle>
                    <S.ContainInputSmall
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="만 나이를 적어주세요."
                        required
                    />
                </S.ContainBox>

                <S.ContainBox>
                    <S.ContainTitle>아이디</S.ContainTitle>
                    <S.ContainInputSmall
                        onChange={handleIdChange} // 중복 확인 처리
                        placeholder="아이디를 적어주세요."
                        required
                    />
                    {idError && <S.ErrorIdMessage>{idError}</S.ErrorIdMessage>} {/* 아이디 중복 오류 메시지 */}
                </S.ContainBox>

                <S.ContainBox>
                    <S.ContainTitle>비밀번호</S.ContainTitle>
                    <S.ContainInputSmall
                        onChange={handlePasswordChange}
                        type={showPassword ? "text" : "password"}
                        placeholder="비밀번호를 적어주세요."
                        minLength={8}
                        maxLength={16}
                        required
                    />
                    <S.IconWrapper onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <AiFillEyeInvisible size={24} /> : <AiFillEye size={24} />}
                    </S.IconWrapper>
                    {passwordError && <S.PwErrorMessage>{passwordError}</S.PwErrorMessage>} {/* 비밀번호 오류 메시지 */}
                </S.ContainBox>
                
                <S.SignUpBtn onClick={handleSubmit}>회원가입</S.SignUpBtn>
            </S.InputBox>

            <S.Gologin onClick={() => router.push("/Signin")}>로그인 하러 가기</S.Gologin>
        </S.Container>
    );
}

export default Signup;