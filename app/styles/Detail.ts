import styled, { css } from "styled-components";

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

export const SubmitBox = styled.div<{ isOpen: boolean }>`
    width: 90%;
    top: 40px;
    ${({ isOpen }) =>
        isOpen
            ? css`
                  height: auto; /* 드롭다운이 열리면 높이 자동 조정 */
                  padding-bottom: 20px;
              `
            : css`
                  height: 80px; /* 닫힌 상태의 높이 */
              `
    }

    display: flex;
    flex-direction: column;

    border: 1px solid #d9d9d9;
    border-radius: 15px;
    background-color: #fff;

    position: relative;
    cursor: pointer;
    transition: height 0.3s ease, padding-bottom 0.3s ease;
`;


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

export const DetailIcon = styled.img<{ isOpen: boolean }>`
    position: absolute;
    width: 22px;
    height: 22px;
    left: 290px;
    top: 13px;

    ${({ isOpen }) =>
        isOpen &&
        css`
            transform: rotate(90deg);
        `}
    transition: transform 0.3s ease;
`;

export const QuestionBox = styled.div`
    width: 100%;
    height: auto;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    border-top: 1px solid #CAC4D0;
    padding-right: 10px;
    padding-top: 15px;
    padding-bottom: 15px;
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

export const NonDrop = styled.div`
    width: 100%;
    top: 20px;

    display: flex;
    flex-direction: column;
    align-items: center;

    position: relative;
`

export const DropdownOption = styled.div<{ isSelected: boolean }>`
    width: 100%;

    display: flex;
    justify-content: center;
    align-items: center;

    padding: 10px;
    text-align: center;

    font-family: Pretendard;
    font-size: 14px;
    font-weight: 600;
    color: black;

    background-color: ${({ isSelected }) => (isSelected ? "#e0e0e0" : "#f5f5f5")};
    cursor: pointer;

    &:hover {
        background-color: #e0e0e0;
    }
`;


export const Dropdown = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 10px;

    background-color: white;
    z-index: 1;

    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;


export const ExpandedContent = styled.div`
  width: 90%;
  left: 25px;
  
  font-family: Pretendard;
  font-size: 14px;
  font-weight: 400;
  color: #49454f;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;

  position: relative;
`;

export const EST = styled.div`
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`