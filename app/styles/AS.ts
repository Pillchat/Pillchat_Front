import styled from "styled-components";

export const Container = styled.div`
    width: 100%;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;

    overflow: hidden;
`

export const Pharse = styled.div`
    width: 100%;
    height: 50px;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    position: relative;
    top: 300px;
`

export const Success = styled.span`
    font-family: Pretendard;
    font-size: 21px;
    font-weight: 700;
`

export const Check = styled.img`
    width: 40px;
    height: 40px;
`

export const Btn = styled.div`
    width: 140px;
    height: 30px;
    left: 90px;
    top: 600px;

    display: flex;
    justify-content: center;
    align-items: center;

    font-family: Pretendard;
    font-size: 14px;
    font-size: 300;

    background-color: white;
    color: #ff412e;
    border: 1px solid #FF412E;
    border-radius: 15px;

    position: relative;
`