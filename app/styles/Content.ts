import styled from "styled-components";

export const Container = styled.div`
    width: 100%;
    height: 100vh;

    display: flex;
    flex-direction: column;
    align-items: center;

    overflow-y: scroll;
    padding-bottom: 120px; 
`

export const AnswerBlock = styled.div`
    width: 90%;
    top: -10px;

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
    position: fixed;
    right: 20px;
    top: 63px;

    font-family: Pretendard;
    font-size: 16px;
    font-weight: 600;

    color: #726F76;
    
    z-index: 10;
`

export const Q = styled.span`
    position: relative;
    left: 20px;

    font-family: Pretendard;
    font-size: 22px;
    font-weight: 700;

    color: #FF412E;

    display: inline-block; /* inline-block 설정 */
    vertical-align: top; /* 상단 정렬 */
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

    flex-direction: column;  // 세로로 정렬
    align-items: flex-start; // 왼쪽 정렬
    justify-content: flex-start;
    gap: 5px;

    position: relative;
`

export const Daily = styled.span`
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 500;

    color: #757575;

    display: flex;

    position: relative;
    left: -127px;
    top: 20px;
`

export const ST = styled.span`
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 500;

    color: #757575;

    position: relative;
    left: -25px;
    top: -11px;
`

export const User = styled.span`
    font-family: Pretendard;
    font-size: 14px;
    font-weight: 500;

    color: #757575;

    position: relative;
    left: 100px;
    top: -43px;
`

export const Udong = styled.div`
    width: 100%;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
`

export const Content = styled.textarea`
  position: relative;
  width: 90%;
  top: 94px;

  padding-top: 10px;
  padding-bottom: 10px;

  font-family: Pretendard;
  font-size: 14px;
  font-weight: 700;

  display: inline-block;

  color: black;
  background-color: white;

  resize: none;  // 크기 조정 불가능

  border: none;
  outline: none;
`;


export const SVGbox = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 10px;

    position: relative;
    left: 100px;
    top: -10px;
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
    top: 20px;

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
    top: 55px;

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
    left: 260px;
    bottom: 0px;

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

    position: relative;
    flex-shrink: 0;
`

export const ImageContainer = styled.img`
    width: 90%;
    height: 200px;
    top: -20px;
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
    height: 250px;
    top: 30px;

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
  height: 350px;
  overflow-y: auto;  /* 수직 스크롤 가능 */
  margin-top: 10px;
`;


export const eyes = styled.span`
    font-family: Pretendard;
    font-size: 12px;
    font-weight: 800;

    color: #726F76;
`