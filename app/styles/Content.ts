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
    
    z-index: 10;
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
    background-color: white;

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
    background-color: white;

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
    left: 100px;
    top: 110px;
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
    top: 260px;

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
    top: 145px;

    display: flex;
    flex-direction: column;
    gap: 30px;

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

export const UserAnswerContentList = styled.textarea`
    width: 90%;
    height: 60px;
    left: 20px;
    
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 300;

    color: black;
    border-bottom: 1px solid #e0e0e0;

    position: relative;

    &::placeholder {
        font-family: Pretendard;
        font-size: 14px;
        font-weight: 300;

        color: #757575;
    }
`

export const AnswerBB = styled.div`
    position: relative;
    width: 100%;
    height: 50px;
    top: -20px;

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

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

export const AnswerPlusBtn = styled.div`
    width: 80px;
    height: 30px;
    top: 170px;
    left: 260px;

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

    position: absolute;
`

export const ImageContainer = styled.div`
    width: 90%;
    height: 200px;
    top: 100px;
    background-color: #f0f0f0;  /* 사진이 없는 경우 배경 색상 */

    display: flex;
    justify-content: center;
    align-items: center;

    position: relative;
    overflow: hidden;
`;

export const Image = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;  /* 이미지를 비율에 맞게 자르거나 채워서 보여줌 */
`;

export const UserAnswerContainer = styled.div`
    width: 100%;
    height: 200px;
    top: 100px;

    display: flex;
    flex-direction: column;
    gap: 30px;

    border-top: 2px solid #CAC4D0;
    position: relative;
`;

export const UserAnswerBlockComent = styled.h2`
    font-family: Preatendard;
    font-size: 20px;
    font-weight: bolder;

    position: relative;
    left: 16px;
    top: 10px;
`;

export const UserAnswerScroll = styled.div`
  max-height: 300px; /* 스크롤 영역의 최대 높이 */
  overflow-y: auto;  /* 수직 스크롤 가능 */
  margin-top: 10px;
`;


export const eyes = styled.span`
    font-family: Pretendard;
    font-size: 12px;
    font-weight: 800;

    color: #726F76;
`