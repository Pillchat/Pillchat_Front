'use client'

import React from "react";
import * as S from "../styles/Start";

function Start(){
    return(
        <S.Container>
            <S.TitleIMG src="Yakchat.svg" />
            
            <S.BtnDiv>
                <S.SignInBtn>로그인</S.SignInBtn>
                <S.SignUpBtn>회원가입</S.SignUpBtn>
            </S.BtnDiv>
        </S.Container>
    );
}

export default Start;