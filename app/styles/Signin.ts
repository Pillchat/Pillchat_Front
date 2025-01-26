import styled from "styled-components";

export const Container = styled.div`
    width: 100%;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;
`

export const PageTitle = styled.span`
    position: relative;
    top: 80px;

    font-family: Pretendard;
    font-size: 34px;
    font-weight: 500;
`

export const LoginBox = styled.div`
    width: 90%;
    height: 300px;
    top: 130px;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;

    position: relative;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
`

export const ContainBox = styled.div`
    width: 90%;

    display: flex;
    flex-direction: column;
    gap: 5px;
`

export const ContainTitle = styled.span`
    font-family: Pretendard;
    font-size: 16px;
    font-weight: 400;
`

export const ContainInput = styled.input`
    width: 100%;
    height: 35px;

    border: 1px solid #D9D9D9;
    border-radius: 6px;

    padding-left: 15px;

    &::placeholder{
        font-family: Pretendard;

        color: black;
    }
`

export const AutoBox = styled.div`
    width: 90%;

    display: flex;
    flex-direction: column;
`

export const AutoLog = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
`

export const Check = styled.input.attrs({ type: 'checkbox' })`
    width: 15px;
    height: 15px;
    cursor: pointer;

    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;

    border: 1px solid #CAC4D0;
    border-radius: 3px;

    display: inline-block;
    position: relative;

    &:checked {
        background-color: #FF412E;
        border-color: #FF412E;
    }

    &:checked::after {
        content: '✔';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12px;
        color: white;
    }
`;

export const ContainDes = styled.span`
    font-family: Pretendard;
    font-size: 16px;
    font-weight: 400;

    color: #757575;

    padding-left: 25px;
`

export const LogBtn = styled.div`
    width: 90%;
    height: 30px;

    display: flex;
    justify-content: center;
    align-items: center;
    
    font-family: Pretendard;
    font-size: 12px;

    border-radius: 5px;
    color: white;
    background-color: #FF412E;
`

export const IconWrapper = styled.div`
    position: absolute;
    margin-top: 34.5px;
    margin-left: 260px;
    cursor: pointer;
    color: #FF412E;
`;

export const Gosignup = styled.span`
    position: absolute;
    top: 750px;
    left: 230px;

    font-family: Pretendard;
    font-size: 14px;
    font-weight: 300;

    color: #FF412E;
`