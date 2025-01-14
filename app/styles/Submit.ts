import styled from "styled-components";

export const Container = styled.div`
    width: 100vw;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const BOx = styled.div`
    width: 80%;
    height: 485px;
    top: 50px;

    display: flex;
    flex-direction: column;

    border: 1px solid #CAC4D0;
    position: relative;
`;

export const SubmitDIv = styled.div`
    width: 100%;
    height: 30px;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
`;

export const SubmitTitle = styled.span`
    font-family: Pretendard;
    font-size: 16px;
    font-weight: 300;
    
    flex-grow: 1;
`;

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

export const Button = styled.div`
    width: 120px;
    height: 40px;
    left: 85px;
    top: 70px;

    display: flex;
    justify-content: center;
    align-items: center;

    font-family: Pretendard;
    font-weight: 300;
    font-size: 16px;
    
    color: white;
    background-color: #FF412E;

    border-radius: 8px;
    position: relative;
`;
