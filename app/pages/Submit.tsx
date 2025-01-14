'use client'

import React, { useState } from "react";
import * as S from "../styles/Submit";
import axios from "axios";

function Submit() {
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

    const handleCheckboxChange = (subject: string) => {
        setSelectedSubjects((prev) =>
            prev.includes(subject)
                ? prev.filter((item) => item !== subject)
                : [...prev, subject]
        );
    };

    const handleSubmit = async () => {
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_REACT_APP_BASE_URL}/???`, {
                subjects: selectedSubjects,
            });
            console.log("전송 성공:", response.data);
        } catch (error) {
            console.error("전송 실패:", error);
        }
    };

    return (
        <S.Container>
            <S.BOx>
                {["약사윤리", "생화학", "미생물학", "물리약학", "의약품분석학", "약물치료학", "해부생리학", "약물학", "의약품합성학", "생약학"
                    , "약제학", "약물동태학", "병태생리학", "면역학", "보건사회약학", "독성학"
                ].map((subject, index) => (
                    <S.SubmitDIv key={index}>
                        <S.SubmitTitle>{subject}</S.SubmitTitle>
                        <S.Check
                            type="checkbox"
                            checked={selectedSubjects.includes(subject)}
                            onChange={() => handleCheckboxChange(subject)}
                        />
                    </S.SubmitDIv>
                ))}
            </S.BOx>
            <S.Button onClick={handleSubmit}>질문 등록하기</S.Button>
        </S.Container>
    );
}

export default Submit;
