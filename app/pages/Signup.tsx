'use client'

import React, { useState } from "react";
import * as S from "../styles/Signup";
import HeaderNon from "../components/Header_Non";
import axios from "axios";
import { useRouter } from "next/navigation";

function Signup(){
    const [schoolValue, setSchoolValue] = useState("");
    const [gradeValue, setGrade] = useState("");
    const [ageValue, setAge] = useState("");
    const [idValue, setId] = useState("");
    const [passwordValue, setPassword] = useState("");
    const router = useRouter();

    function handleSchoolChange(e: React.ChangeEvent<HTMLInputElement>){
        setSchoolValue(e.target.value);
    };

    function handleGradeChange(e: React.ChangeEvent<HTMLInputElement>){
        setGrade(e.target.value);
    };

    function handleAgeChange(e: React.ChangeEvent<HTMLInputElement>){
        setAge(e.target.value);
    };

    function handleIdChange(e: React.ChangeEvent<HTMLTextAreaElement>){
        setId(e.target.value);
    };

    function handlePasswordChange(e: React.ChangeEvent<HTMLTextAreaElement>){
        setPassword(e.target.value);
    };

    const handleSubmit = async (e: React.MouseEvent<HTMLDivElement>) => {
        const dto = {
            school: schoolValue,
            grade: gradeValue,
            age: ageValue,
            username: idValue,
            password: passwordValue
        }

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/auth/register`, dto, {
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
            <S.PageTitle>회원가입</S.PageTitle>

            <S.InputBox>
                <S.ContainBox>
                    <S.ContainTitle>학교</S.ContainTitle>
                    <S.ContainInputSmall onChange={handleSchoolChange} placeholder="학교를 적어주세요. (ex. XX대학교)" />
                </S.ContainBox>

                <S.ContainBox>
                    <S.ContainTitle>학년</S.ContainTitle>
                    <S.ContainInputSmall onChange={handleGradeChange} placeholder="학년을 적어주세요. (ex. X학년, X학년 중 휴학, 졸업)" />
                </S.ContainBox>

                <S.ContainBox>
                    <S.ContainTitle>연령</S.ContainTitle>
                    <S.ContainInputSmall onChange={handleAgeChange} placeholder="연령을 적어주세요. (ex. 20)" />
                </S.ContainBox>

                <S.ContainBox>
                    <S.ContainTitle>아이디</S.ContainTitle>
                    <S.ContainInputLarge
                        onChange={handleIdChange}
                        placeholder="아이디를 적어주세요.
                            &#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#10;&#13;&#10;&#13;&#10;&#13;
                            &#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;
                            &#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;
                        (8글자 이내, 한글/영어/숫자)"
                    />
                </S.ContainBox>

                <S.ContainBox>
                    <S.ContainTitle>비밀번호</S.ContainTitle>
                    <S.ContainInputLarge
                        onChange={handlePasswordChange}
                        placeholder="비밀번호를 적어주세요.
                            &#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#10;&#13;&#10;&#13;&#10;&#13;
                            &#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;
                            &#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;&#13;&#10;
                        (12글자 이내, 한글/영어/숫자)"
                    />
                </S.ContainBox>

                <S.SignUpBtn onClick={handleSubmit}>회원가입</S.SignUpBtn>
            </S.InputBox>
        </S.Container>
    );
}

export default Signup;