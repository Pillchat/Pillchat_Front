import styled from "styled-components";

export const Container = styled.div`
    width: 100%;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;

    overflow-y: scroll;
    padding-bottom: 100px;
`


export const MYpage = styled.span`
    font-family: Pretendard;
    font-size: 20px;
    font-weight: 600;

    color: black;

    position: relative;
    top: 25px;
`

export const Alarm = styled.img`
    position: relative;
    width: 30px;
    height: 30px;
    left: 140px;
    top: -5px;
`

export const ProfileWrapper = styled.div`
    position: relative;
    width: 70px;
    height: 70px;
    aspect-ratio: 1 / 1;
    left: -110px;
    top: 30px;
`;

export const ProfileImg = styled.img`
    width: 100%;
    height: 100%;

    border-radius: 50%;
    border: 2px solid #ccc;
    object-fit: cover;

    cursor: pointer;
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const ID = styled.span`
    position: relative;
    top: -40px;

    font-family: Pretendard;
    font-size: 25px;
    font-weight: 600;

    color: black;
`

export const SN = styled.span`
    position: relative;
    top: -40px;

    display: flex;
    flex-direction: column;
    align-items: flex-start;

    font-family: Pretendard;
    font-size: 18px;
    font-weight: 500;

    color: black;
`

export const ForthBox = styled.div`
    position: relative;
    width: 90%;
    height: 140px;

    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    border: 1px solid #D9D9D9;
    border-radius: 30px;
`

export const ContentBox = styled.div`
    width: 50%;
    height: 70px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`

export const ContentTitle = styled.span`
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 500;

    color: black;
`

export const ContentNumber = styled.span`
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 500;

    color: #ff412e;
`

export const LineW = styled.div`
    position: absolute;
    width: 90%;
    left: 15px;
    top: 70px;

    border: 1px solid #D9D9D9;
`

export const LineH = styled.div`
    position: absolute;
    width: 30%;
    left: 113px;
    top: 70px;

    border: 1px solid #D9D9D9;
    transform: rotate(90deg);
`

export const MenuDiv = styled.div`
    position: relative;
    width: 100%;
    height: auto;
    top: 30px;

    padding-top: 10px;
    padding-bottom: 10px;

    display: flex;
    flex-direction: column;
    gap: 10px;

    border-top: 1px solid #d9d9d9;
`

export const DivTitle = styled.span`
    position: relative;
    left: 15px;

    font-family: Pretendard;
    font-size: 12px;
    font-weight: 500;

    color: #FF412E;
`


export const MenuContent = styled.div`
    width: 100%;
    height: 40px;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`

export const MenuSVG = styled.img`
    width: 25px;
    height: 25px;
`

export const MenuLine = styled.div`
    width: 85%;
    height: 40px;

    display: flex;
    flex-direction: column;
    justify-content: center;

    padding-left: 10px;
`

export const MenuTitle = styled.span`
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 600;
`

export const MenuDes = styled.span`
    font-family: Pretendard;
    font-size: 10px;
    font-weight: 500;

    color: #49454F;
`