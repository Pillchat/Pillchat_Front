'use client'

import * as S from "../styles/Home"
import React, { useState } from "react";
import QModal from "../components/QModal";

function Home() {
    const [ModalOpen, setModalOpen] = useState(false);

    function ModalClick(e: React.MouseEvent<HTMLDivElement>){
        setModalOpen(true);
    }

    return (
        <>
            {ModalOpen && (
                <QModal onClose={() => setModalOpen(false)} />
            )}
            
            <S.Container>
                <S.Prebox onClick={ModalClick}>
                    <S.BoxTitle>오늘의 질문 처방전</S.BoxTitle>
                    <S.BoxTitleLine />
                    <S.Qta>클릭해서 궁금한 것 질문하기</S.Qta>
                    <S.BtnDiv>
                        <S.CameraBtn>
                            <S.CameraSVG src="Camera.svg" />
                        </S.CameraBtn>
                        
                        <S.ArrowBtn>
                            <S.ArrowSVG src="Arrow.svg" />
                        </S.ArrowBtn>
                    </S.BtnDiv>
                </S.Prebox>
            </S.Container>
        </>
    );
}

export default Home;
