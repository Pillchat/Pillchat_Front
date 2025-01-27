import styled from "styled-components";

export const background = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(58, 61, 67, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

export const ModalContainer = styled.div`
    width: 90%;
    height: 550px;

    display: flex;
    flex-direction: column;
    align-items: center;

    background-color: white;
    border: 1px solid #FF412E;
    border-radius: 25px;
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

export const TitltArea = styled.textarea`
    width: 80%;
    height: 80px;
    top: 50px;

    font-family: Pretendard;
    font-size: 25px;
    font-weight: 700;

    position: relative;

    &::placeholder {
        color: black;
    }
`

export const ContentArea = styled.textarea`
    width: 80%;
    height: 180px;
    top: 55px;

    font-family: Pretendard;
    font-size: 16px;
    font-weight: 500;

    position: relative;

    &::placeholder {
        color: black;
    }
`

export const BtnDiv = styled.div`
    width: 100%;
    top: 200px;

    display: flex;
    flex-direction: row;
    justify-content: space-between;

    padding-left: 10px;
    padding-right: 20px;

    position: relative;
`

export const ArrowBtn = styled.div`
    background-color: #FF412E;
    border-radius: 50px;

    display: flex;
    justify-content: center;
    align-items: center;

    width: 45px;
    height: 45px;
`

export const ArrowSVG = styled.img`
    width: 25px;
    height: 25px;
`

export const CameraBtn = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    width: 45px;
    height: 45px;

    position: relative;

`

export const CameraSVG = styled.img`
    width: 25px;
    height: 25px;
`

export const FileNames = styled.div`
    margin-top: 10px;
    font-family: Pretendard;
    font-size: 14px;
    color: #333;
    width: 80%;
`;

export const FileName = styled.div`
    margin: 5px 0;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
`;
