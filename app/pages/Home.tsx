'use client'

import * as S from "../styles/Home"
import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

function Home() {
    const [InputValue, SetInputValue] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isClient, setIsClient] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleSubmit = async (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("question", InputValue);

        if (imageFile) {
            formData.append("file", imageFile);
        }

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/???`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true,
                }
            );

            router.push("/submit");

        } catch (error) {
            console.log("질문 및 이미지 업로드 실패:", error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        SetInputValue(e.target.value);
    };

    const handleImageUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
        }
    };

    // 클라이언트에서만 렌더링하도록 조건부 처리
    if (!isClient) return null;

    return (
        <S.Container>
            <S.Prebox>
                <S.BoxTitle>오늘의 질문 처방전</S.BoxTitle>
                <S.BoxTitleLine />
                <S.Qta onChange={handleInputChange} placeholder="클릭해서 궁금한 것 질문하기" />
                <S.BtnDiv>
                    <S.CameraBtn onClick={handleImageUploadClick}>
                        <S.CameraSVG src="Camera.svg" />
                    </S.CameraBtn>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                    />
                    <S.ArrowBtn onClick={handleSubmit}>
                        <S.ArrowSVG src="Arrow.svg" />
                    </S.ArrowBtn>
                </S.BtnDiv>
            </S.Prebox>
        </S.Container>
    );
}

export default Home;
