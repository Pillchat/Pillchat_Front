'use client'

import React, { useState } from "react";
import * as S from "../styles/QnA"
import axios from "axios";
import { useRouter } from "next/navigation";
import HeaderNon from "../components/Header_Non";

function QnA(){
    return(
        <S.Container>
            <HeaderNon />

            <S.TitleBlock>
                <S.TitleText>원하는 답변 찾기</S.TitleText>
                <S.SearchIcon src="searchBL.svg" />
            </S.TitleBlock>

            <S.SearchBarContainer>
                <S.MenuSVG src="menu.svg" />
                <S.SearchInput placeholder="원하는 답변을 검색해보세요." />
                <S.SearchSVG src="search.svg" />
            </S.SearchBarContainer>

            <S.AnswerContainer>
                <S.AnswerBlock>
                    <S.TitleText>답변해주기</S.TitleText>
                    <S.CheckIcon src="check.svg" />
                </S.AnswerBlock>

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
                </S.QCbox>


            </S.AnswerContainer>


            <S.DetailBox>
                <S.DetailName>더 보기</S.DetailName>
                <S.DetailIcon src="ArrowIcon.svg" />
            </S.DetailBox>
        </S.Container>
    );
}

export default QnA;