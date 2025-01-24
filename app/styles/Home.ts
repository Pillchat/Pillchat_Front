import styled from "styled-components";

export const Container = styled.div`
    width: 100vw;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;
`

export const Prebox = styled.div`
    width: 80%;
    height: 250px;
    top: 50px;

    display: flex;
    flex-direction: column;
    align-items: center;

    border: 3px solid #FF412E;
    border-radius: 15px;

    position: relative;
`

export const BoxTitle = styled.span`
    position: relative;
    top: 30px;

    font-family: Pretendard;
    font-size: 18px;
    font-weight: 500;
    line-height: 20px;

    display: flex;
    justify-content: center ;
    letter-spacing: 0.01em;
    font-feature-settings: 'pnum' on, 'lnum' on;

    color: #000000;
`

export const BoxTitleLine = styled.div`
    position: relative;
    width: 135px;
    height: 0px;
    top: 24px;

    background: rgba(255, 65, 46, 0.45);
    border: 3px solid rgba(255, 65, 46, 0.45);
`

export const Qta = styled.span`
    position: relative;
    top: 70px;

    font-family: Pretendard;
    font-size: 14px;
    font-weight: 500;
    color: #BFBFBF;
`

export const BtnDiv = styled.div`
    width: 100%;
    top: 140px;

    display: flex;
    flex-direction: row;
    gap: 180px;

    position: relative;
`

export const ArrowBtn = styled.div`
    background-color: #FF412E;
    border-radius: 50px;

    display: flex;
    justify-content: center;
    align-items: center;

    width: 35px;
    height: 35px;
`

export const ArrowSVG = styled.img`
    width: 25px;
    height: 25px;
`

export const CameraBtn = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    width: 35px;
    height: 35px;
    left: 30px;

    position: relative;

`

export const CameraSVG = styled.img`
    width: 25px;
    height: 25px;
`