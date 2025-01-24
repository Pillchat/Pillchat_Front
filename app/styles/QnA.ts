import styled from "styled-components";

export const Container = styled.div`
    width: 100%;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;

    overflow: hidden;
`

export const TitleBlock = styled.div`
    width: 90%;
    top: 20px;

    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    position: relative;
`

export const AnswerBlock = styled.div`
    width: 90%;
    left: 15px;
    top: 140px;

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

export const SearchIcon = styled.img`
    width: 20px;
    height: 20px;
`

export const CheckIcon = styled.img`
    width: 30px;
    height: 30px;
`

export const SearchBarContainer = styled.div`
    width: 90%;
    height: 40px;
    top: 30px;

    display: flex;
    flex-direction: row;
    align-items: center;

    padding: 10px;

    border: 1px solid #FF412E;
    border-radius: 50px;

    position: relative;
`

export const MenuSVG = styled.img`
    width: 30px;
    height: 30px;
`

export const SearchSVG = styled.img`
    width: 30px;
    height: 30px;
`

export const SearchInput = styled.input`
    width: 100%;
    height: 100%;

    font-family: Pretendard;
    font-size: 14px;
    font-weight: 300;

    &::placeholder {

        color: #49454F;
    }
`

export const AnswerContainer = styled.div`
    width: 100%;
    top: 120px;
    
    display: flex;
    flex-direction: column;

    position: relative;
`

export const DetailBox = styled.div`
    position: absolute;
    left: 290px;
    top: 385px;


    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
`

export const DetailName = styled.span`
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 600;

    color: black;
`

export const DetailIcon = styled.img`
    width: 18px;
    height: 18px;
`

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
    height: 490px;
    top: 155px;

    position: relative;
`

export const InIcon = styled.img`
    width: 30px;
    height: 30px;
    
    transform: rotate(180deg);
`

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

export const Dropdown = styled.div`
  position: absolute;
  top: 160px;
  left: 15px;

  width: 150px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px 0;

  background-color: white;
  border: 1px solid #cac4d0;
  border-radius: 5px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);

  z-index: 1000;

  ::-webkit-scrollbar {
    width: 6px; /* 스크롤바 가로 */
  }
  ::-webkit-scrollbar-track {
    background: #f5f5f5; /* 트랙 배경색 */
  }
  ::-webkit-scrollbar-thumb {
    background: #cac4d0; /* 스크롤 핸들 색상 */
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #b0a9b5; /* 스크롤 핸들 호버 색상 */
  }
`;


export const DropdownItem = styled.div`
  padding: 10px 15px;

  font-family: Pretendard;
  font-size: 14px;
  font-weight: 500;
  color: #49454f;

  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }
`;
