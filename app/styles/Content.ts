import styled from "styled-components";

export const Container = styled.div`
    width: 100vw;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;
`

export const AnswerBlock = styled.div`
    width: 90%;
    top: 20px;

    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    position: relative;
`

export const TitleText = styled.span`
    font-family: Pretendard;
    font-size: 20px;
    font-weight: 700;

    color: black;
`

export const CheckIcon = styled.img`
    width: 30px;
    height: 30px;
`

export const AnswerContainer = styled.div`
    width: 100%;
    top: 20px;
    
    display: flex;
    flex-direction: column;
    align-items: center;

    position: relative;
`

export const TurnPage = styled.span`
    position: absolute;
    left: 280px;
    top: 95px;

    font-family: Pretendard;
    font-size: 16px;
    font-weight: 600;

    color: #726F76;
`

export const Q = styled.span`
    font-family: Pretendard;
    font-size: 22px;
    font-weight: 700;

    color: #FF412E;

    position: relative;
    left: 20px;
`

export const QC = styled.textarea`
    width: 80%;

    font-family: Pretendard;
    font-size: 20px;
    font-weight: 700;

    color: black;

    position: relative;
    left: 20px;
    top: 14px;
    resize: none;
`

export const Qbox = styled.div`
    width: 100%;
    top: 40px;

    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;

    position: relative;
`

export const Daily = styled.span`
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 500;

    color: #757575;

    position: absolute;
    left: 20px;
    top: 150px;
`

export const ST = styled.span`
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 500;

    color: #757575;

    position: absolute;
    left: 100px;
    top: 150px;
`

export const User = styled.span`
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 500;

    color: #757575;

    position: absolute;
    left: 230px;
    top: 150px;
`

export const Content = styled.textarea`
    width: 90%;

    font-family: Pretendard;
    font-size: 14px;
    font-weight: 700;

    color: black;

    position: relative;
    top: 94px;
    resize: none;
`

export const SVGbox = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 10px;

    position: relative;
    left: 120px;
    top: 120px;
`

export const SoloSVG = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 3px;
`

export const SVG = styled.img`
    width: 15px;
    height: 15px;
`

export const count = styled.span`
    font-family: Pretendard;
    font-size: 10px;
    font-weight: 500;

    color: #726F76;
`