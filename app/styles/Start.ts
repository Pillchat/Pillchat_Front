import styled from "styled-components";

export const Container = styled.div`
    width: 100%;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 150px;
`

export const TitleIMG = styled.img`
    width: 300px;
    height: 300px;
`

export const BtnDiv = styled.div`
    width: 80%;

    display: flex;
    flex-direction: column;
    gap: 20px;
`

export const SignInBtn = styled.div`
    width: 100%;
    height: 30px;

    display: flex;
    justify-content: center;
    align-items: center;
    
    font-family: Pretendard;
    font-size: 12px;

    border: 1px solid #49454F;
    border-radius: 5px;
    color: #49454F;
    background-color: white;
`

export const SignUpBtn = styled.div`
    width: 100%;
    height: 30px;

    display: flex;
    justify-content: center;
    align-items: center;
    
    font-family: Pretendard;
    font-size: 12px;

    border: 1px solid #FF412E;
    border-radius: 5px;
    color: white;
    background-color: #FF412E;
`