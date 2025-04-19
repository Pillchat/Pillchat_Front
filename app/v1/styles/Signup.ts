import styled from "styled-components";

export const Container = styled.div`
  width: 100%;
  height: 100vh;

  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const PageTitle = styled.span`
  position: relative;
  top: 80px;

  font-family: Pretendard;
  font-size: 34px;
  font-weight: 500;
`;

export const InputBox = styled.div`
  width: 100%;
  top: 130px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;

  position: relative;
`;

export const ContainBox = styled.div`
  width: 90%;

  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const ContainTitle = styled.span`
  font-family: Pretendard;
  font-size: 20px;
  font-weight: 700;
`;

export const ContainInputSmall = styled.input`
  width: 100%;
  height: 35px;

  border: 1px solid #d9d9d9;
  border-radius: 6px;

  padding-left: 15px;

  &::placeholder {
    font-family: Pretendard;

    color: black;
  }
`;

export const ContainInputLarge = styled.textarea`
  width: 100%;
  height: 65px;

  border: 1px solid #d9d9d9;
  border-radius: 6px;

  padding-left: 15px;

  &::placeholder {
    font-family: Pretendard;

    color: black;
  }
`;

export const SignUpBtn = styled.div`
  position: relative;
  width: 90%;
  height: 30px;
  top: 15px;

  display: flex;
  justify-content: center;
  align-items: center;

  font-family: Pretendard;
  font-size: 12px;

  border: 1px solid #ff412e;
  border-radius: 5px;
  background-color: #ff412e;
  color: white;

  z-index: 10;
`;

export const ContainSelect = styled.select`
  width: 100%;
  height: 35px;

  border: 1px solid #d9d9d9;
  border-radius: 6px;

  padding-left: 15px;

  font-family: Pretendard;
  color: black;

  &:focus {
    outline: none;
    border-color: #ff412e;
  }
`;

export const IconWrapper = styled.div`
  position: absolute;
  margin-top: 40px;
  margin-left: 290px;
  cursor: pointer;
  color: #ff412e;
`;

export const ErrorIdMessage = styled.div`
  position: absolute;
  left: 20px;
  top: 345px;

  font-family: Pretendard;
  font-size: 12px;

  color: #f04438;
`;

export const PwErrorMessage = styled.div`
  position: absolute;
  left: 20px;
  top: 435px;

  font-family: Pretendard;
  font-size: 12px;

  color: #f04438;
`;

export const Gologin = styled.span`
  position: absolute;
  top: 750px;
  left: 250px;

  font-family: Pretendard;
  font-size: 14px;
  font-weight: 300;

  z-index: 10;

  color: #ff412e;
`;
