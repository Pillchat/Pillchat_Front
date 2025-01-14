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
    top: 120px;

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