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
    const [isClient, setIsClient] = useState(false);

    const router = useRouter();

    function handleSchoolChange(e: React.ChangeEvent<HTMLInputElement>) {
        setSchoolValue(e.target.value);
    }

    function handleGradeChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setGrade(e.target.value);
    }

    function handleAgeChange(e: React.ChangeEvent<HTMLInputElement>) {
        setAge(e.target.value);
    }

    function handleIdChange(e: React.ChangeEvent<HTMLInputElement>) {
        setId(e.target.value);
    }

    function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        setPassword(e.target.value);
    };

    useEffect(() => {
                setIsClient(true);
            }, []);
        
    if (!isClient) return null;

    const handleSubmit = async (e: React.MouseEvent<HTMLDivElement>) => {
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

    return (
        <S.Container>
            <HeaderNon />
            <S.PageTitle>회원가입</S.PageTitle>

            <S.InputBox>
                <S.ContainBox>
                    <S.ContainTitle>학교</S.ContainTitle>
                    <S.ContainInputSmall
                        onChange={handleSchoolChange}
                        placeholder="학교를 적어주세요. (ex. XX대학교)"
                        required
                    />
                </S.ContainBox>

                <S.ContainBox>
                    <S.ContainTitle>학년</S.ContainTitle>
                    <S.ContainSelect
                        onChange={handleGradeChange}
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
                        onChange={handleAgeChange}
                        placeholder="연령을 적어주세요. (ex. 20)"
                        required
                    />
                </S.ContainBox>

                <S.ContainBox>
                    <S.ContainTitle>아이디</S.ContainTitle>
                    <S.ContainInputSmall
                        onChange={handleIdChange}
                        placeholder="아이디를 적어주세요."
                        required
                    />
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
                </S.ContainBox>

                <S.SignUpBtn onClick={handleSubmit}>회원가입</S.SignUpBtn>
            </S.InputBox>
        </S.Container>
    );
}

export default Signup;
