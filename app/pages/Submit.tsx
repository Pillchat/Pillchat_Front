'use client';

import React, { useState } from "react";
import * as S from "../styles/Submit";
import axios from "axios";
import { useRouter } from "next/navigation";
import { subjects, subjectMap } from "../subjects";

function Submit() {
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [title, setTitle] = useState<string>(localStorage.getItem('title') || '');
    const [content, setContent] = useState<string>(localStorage.getItem('content') || '');
    const [images, setImages] = useState<string[]>(JSON.parse(localStorage.getItem('images') || '[]'));

    const JWT_EXPIRY_TIME = 24 * 3600 * 1000;
    const router = useRouter();

    const handleCheckboxChange = (subject: string) => {
        setSelectedSubjects((prev) =>
            prev.includes(subject)
                ? prev.filter((item) => item !== subject)
                : [...prev, subject]
        );
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            console.error("토큰이 없습니다. 인증이 필요합니다.");
            return;
        }

        const subjectIds = selectedSubjects.map((subject) => subjectMap[subject]);
        const dto = {
            title: title,
            content: content,
            images: images,
            subjectId: subjectIds,
            isAnonymous: true,
        };

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/api/questions`, dto, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'ngrok-skip-browser-warning': '69420',
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true,
            });

            console.log("전송 성공:", response.data);
            window.localStorage.removeItem('title');
            window.localStorage.removeItem('content');
            window.localStorage.removeItem('images');

            if (response.status === 200) {
                const { access, refresh } = response.data;

                setTimeout(() => onSilentRefresh(access), JWT_EXPIRY_TIME - 60000);
            }

            router.push("/");
            
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log("전송 실패:", error.response?.data || error.message);
            } else {
                console.error("Unexpected error:", error);
            }
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
                const { access, refresh } = response.data;

                localStorage.setItem("access_token", access);
                localStorage.setItem("refresh_token", refresh);

                setTimeout(() => onSilentRefresh(access), JWT_EXPIRY_TIME - 60000);
            }
        } catch (error: any) {
            console.error("Error while refreshing token:", error);
        }
    };

    return (
        <S.Container>
            <S.BOx>
                {subjects.map((subject, index) => (
                    <S.SubmitDIv key={index}>
                        <S.SubmitTitle>{subject.name}</S.SubmitTitle>
                        <S.Check
                            type="checkbox"
                            checked={selectedSubjects.includes(subject.name)}
                            onChange={() => handleCheckboxChange(subject.name)}
                        />
                    </S.SubmitDIv>
                ))}
            </S.BOx>
            <S.Button onClick={handleSubmit}>질문 등록하기</S.Button>
        </S.Container>
    );
}

export default Submit;
