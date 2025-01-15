'use client';

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import HeaderNon from "../components/Header_Non";
import * as S from "../styles/Content";

function Content() {
    const [isClient, setIsClient] = useState(false);
    const [shareCount, setShareCount] = useState(0); // 공유 수 상태
    const [heartCount, setHeartCount] = useState(0); // 좋아요 수 상태
    const [isHearted, setIsHearted] = useState(false); // 좋아요 활성화 상태

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

    // 공유 버튼 클릭 핸들러
    const handleShareClick = () => {
        setShareCount(shareCount + 1);
        // 나중에 URL 공유 기능 구현 예정
    };

    // 좋아요 버튼 클릭 핸들러
    const handleHeartClick = () => {
        if (isHearted) {
            setHeartCount(heartCount - 1); // 좋아요 취소
        } else {
            setHeartCount(heartCount + 1); // 좋아요 추가
        }
        setIsHearted(!isHearted); // 상태 토글
    };

    return (
        <S.Container>
            <HeaderNon />
            <S.TurnPage>뒤로가기</S.TurnPage>
            
            <S.AnswerContainer>
                <S.AnswerBlock>
                    <S.TitleText>답변해주기</S.TitleText>
                    <S.CheckIcon src="check.svg" />
                </S.AnswerBlock>

                <S.Qbox>
                    <S.Q>Q.</S.Q>
                    <S.QC
                        value="안녕하세요 의약품 분석학 질문 드립니다."
                        readOnly
                        disabled
                    />
                </S.Qbox>
                
                <S.Daily>2025.01.01</S.Daily>
                <S.ST>과목명: 의약품분석학</S.ST>
                <S.User>질문자 : 약챗대표</S.User>

                <S.Content
                    value="안녕하세요 의약품분석학 1단원 너무 어려워서 질문드려요ㅠㅠ 저기 사진에서 pka가 왜 7.2인거죠?? 몇분째 고민하고 있었어요 알려주시면 감사하겠습니다 ㅜㅜ 팜머니 50 추가로 걸었어요!"
                    readOnly
                    disabled
                />
                <S.SVGbox>
                    <S.SoloSVG onClick={handleShareClick}>
                        <S.SVG src="Share.svg" />
                        <S.count>{shareCount}</S.count>
                    </S.SoloSVG>

                    <S.SoloSVG onClick={handleHeartClick}>
                        <S.SVG src={isHearted ? "Heartplus.svg" : "Heart.svg"} />
                        <S.count>{heartCount}</S.count>
                    </S.SoloSVG>

                    <S.SVG src="More.svg" />
                </S.SVGbox>

                {/* <S.Answerbtn>답변하기</S.Answerbtn> */}
            </S.AnswerContainer>

            <S.UserAnswerBlock>
                <S.UserAnswerTitle>나의 답변:</S.UserAnswerTitle>
                <S.UserAnswerContent placeholder="클릭해서 답변을 작성해주세요." />

                <S.AnswerBB>
                    <S.CameraBtn>
                        <S.CameraSVG src="Camera.svg" />
                    </S.CameraBtn>
                    <S.AnswerSubmitBtn>답변 등록</S.AnswerSubmitBtn>
                </S.AnswerBB>
            </S.UserAnswerBlock>
        </S.Container>
    );
}

export default Content;
