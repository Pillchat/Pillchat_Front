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

export const SubmitBox = styled.div`
    width: 90%;
    height: 80px;
    top: 40px;

    display: flex;
    flex-direction: column;

    border: 1px solid #d9d9d9;
    border-radius: 15px;

    position: relative;
`

export const SubmitTitleText = styled.span`
    position: relative;
    left: 15px;
    top: 10px;

    font-family: Pretendard;
    font-size: 20px;
    font-weight: 700;

    color: black;
`

export const SubmitDesText = styled.span`
    position: relative;
    left: 15px;
    top: 10px;

    font-family: Pretendard;
    font-size: 14px;
    font-weight: 500;

    color: #d9d9d9;
`

export const DetailIcon = styled.img`
    position: absolute;

    width: 22px;
    height: 22px;
    left: 290px;
    top: 13px;

    transform: rotate(180deg);
`

export const QuestionBox = styled.div`
    width: 100%;
    height: 70px;

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    border-top: 1px solid #CAC4D0;
    padding-right: 10px;
`

export const Qbox = styled.div`

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 5px;

    position: relative;
    left: 20px;
`

export const Q = styled.span`
    font-family: Pretendard;
    font-size: 16px;
    font-weight: 700;

    color: #FF412E;

`

export const QC = styled.span`
    font-family: Pretendard;
    font-size: 16px;
    font-weight: 700;

    color: black;
`

export const QCbox = styled.div`
    width: 100%;
    top: 60px;

    position: relative;
`

export const InIcon = styled.img`
    width: 30px;
    height: 30px;
    
    transform: rotate(180deg);
`