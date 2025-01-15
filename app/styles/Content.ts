import styled from "styled-components";

export const Container = styled.div`
    width: 100%;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;

    overflow: hidden;
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

export const Answerbtn = styled.div`
    width: 80px;
    height: 30px;
    left: 115px;
    top: 320px;

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

export const UserAnswerBlock = styled.div`
    width: 100%;
    height: 200px;
    top: 400px;

    display: flex;
    flex-direction: column;
    gap: 20px;

    border-top: 2px solid #CAC4D0;
    position: relative;
`

export const UserAnswerTitle = styled.span`
    font-family: Preatendard;
    font-size: 20px;
    font-weight: bolder;

    position: relative;
    left: 16px;
    top: 10px;
`

export const UserAnswerContent = styled.textarea`
    width: 90%;
    height: 60px;
    left: 20px;
    
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 300;

    color: black;

    position: relative;

    &::placeholder {
        font-family: Pretendard;
        font-size: 14px;
        font-weight: 300;

        color: #757575;
    }
`

export const AnswerBB = styled.div`
    width: 100%;
    height: 50px;

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 30px;

    padding-left: 10px;
    padding-right: 10px;
`

export const CameraBtn = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    width: 35px;
    height: 35px;
`

export const CameraSVG = styled.img`
    width: 25px;
    height: 25px;
`

export const AnswerSubmitBtn = styled.div`
    width: 80px;
    height: 30px;

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    font-family: Pretendard;
    font-size: 14px;
    font-size: 300;

    background-color: #FF412E;
    color: white;
    border-radius: 15px;

`