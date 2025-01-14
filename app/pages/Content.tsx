'use client'

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import HeaderNon from "../components/Header_Non";
import * as S from "../styles/Content";

function Content(){
    return(
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
                    <S.QC readOnly disabled>안녕하세요 의약품 분석학 질문 드립니다.</S.QC>
                </S.Qbox>
                
                <S.Daily>2025.01.01</S.Daily>
                <S.ST>과목명: 의약품분석학</S.ST>
                <S.User>질문자 : 약챗대표</S.User>

                <S.Content readOnly disabled>
                    안녕하세요 의약품분석학 1단원 너무 어려워서 질문드려요ㅠㅠ 저기 사진에서 pka가 왜 7.2인거죠?? 몇분째 고민하고 있었어요 알려주시면 감사하겠습니다 ㅜㅜ 팜머니 50 추가로 걸었어요!
                </S.Content>

                <S.SVGbox>
                    <S.SoloSVG>
                        <S.SVG src="Share.svg" />
                        <S.count>0</S.count>
                    </S.SoloSVG>

                    <S.SoloSVG>
                        <S.SVG src="Heart.svg" />
                        <S.count>0</S.count>
                    </S.SoloSVG>

                    <S.SVG src="More.svg" />
                </S.SVGbox>
            </S.AnswerContainer>
        </S.Container>
    );
}

export default Content;