'use client'

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import HeaderNon from "../components/Header_Non";
import * as S from "../styles/Detail";

function Detail(){
    return(
        <S.Container>
            <HeaderNon />
            <S.TurnPage>뒤로가기</S.TurnPage>

            <S.AnswerContainer>
                <S.AnswerBlock>
                    <S.TitleText>답변해주기</S.TitleText>
                    <S.CheckIcon src="check.svg" />
                </S.AnswerBlock>

                <S.SubmitBox>
                    <S.SubmitTitleText>과목명</S.SubmitTitleText>
                    <S.SubmitDesText>제일 자신있는 과목을 선택해서 답변해보세요.</S.SubmitDesText>
                    <S.DetailIcon src="ArrowIcon.svg" />
                </S.SubmitBox>

                <S.QCbox>
                    <S.QuestionBox>
                        <S.Qbox>
                            <S.Q>Q.</S.Q>
                            <S.QC>안녕하세요 약제학 질문 드립니다!</S.QC>
                        </S.Qbox>
                        <S.InIcon src="ArrowIcon.svg" />
                    </S.QuestionBox>
                    
                    <S.QuestionBox>
                        <S.Qbox>
                            <S.Q>Q.</S.Q>
                            <S.QC>안녕하세요 약제학 질문 드립니다!</S.QC>
                        </S.Qbox>
                        <S.InIcon src="ArrowIcon.svg" />
                    </S.QuestionBox>

                    <S.QuestionBox>
                        <S.Qbox>
                            <S.Q>Q.</S.Q>
                            <S.QC>안녕하세요 약제학 질문 드립니다!</S.QC>
                        </S.Qbox>
                        <S.InIcon src="ArrowIcon.svg" />
                    </S.QuestionBox>

                    <S.QuestionBox>
                        <S.Qbox>
                            <S.Q>Q.</S.Q>
                            <S.QC>안녕하세요 약제학 질문 드립니다!</S.QC>
                        </S.Qbox>
                        <S.InIcon src="ArrowIcon.svg" />
                    </S.QuestionBox>

                    <S.QuestionBox>
                        <S.Qbox>
                            <S.Q>Q.</S.Q>
                            <S.QC>안녕하세요 약제학 질문 드립니다!</S.QC>
                        </S.Qbox>
                        <S.InIcon src="ArrowIcon.svg" />
                    </S.QuestionBox>

                    <S.QuestionBox>
                        <S.Qbox>
                            <S.Q>Q.</S.Q>
                            <S.QC>안녕하세요 약제학 질문 드립니다!</S.QC>
                        </S.Qbox>
                        <S.InIcon src="ArrowIcon.svg" />
                    </S.QuestionBox>

                    <S.QuestionBox>
                        <S.Qbox>
                            <S.Q>Q.</S.Q>
                            <S.QC>안녕하세요 약제학 질문 드립니다!</S.QC>
                        </S.Qbox>
                        <S.InIcon src="ArrowIcon.svg" />
                    </S.QuestionBox>

                    <S.QuestionBox>
                        <S.Qbox>
                            <S.Q>Q.</S.Q>
                            <S.QC>안녕하세요 약제학 질문 드립니다!</S.QC>
                        </S.Qbox>
                        <S.InIcon src="ArrowIcon.svg" />
                    </S.QuestionBox>
                </S.QCbox>
            </S.AnswerContainer>
        </S.Container>
    );
}

export default Detail;