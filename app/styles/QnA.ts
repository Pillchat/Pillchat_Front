import styled from "styled-components";

export const Container = styled.div`
    width: 100%;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;
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

    padding-left: 10px;

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
    top: 265px;


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
    top: 40px;

    position: relative;
`

export const InIcon = styled.img`
    width: 30px;
    height: 30px;



    transform: rotate(180deg);
`