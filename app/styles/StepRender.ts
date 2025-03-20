import styled from "styled-components";

export const UserAnswerContentList = styled.div`
  margin-bottom: 20px;
  position: relative;
`;

export const StepTitle = styled.h4`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
`;

export const StepContent = styled.p`
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 10px;
`;

export const StepImage = styled.img`
  width: 100%;
  max-width: 400px;
  border: 1px solid #ddd;
  padding: 5px;
`;

export const UserAnswerContainer = styled.div`
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fafafa;

  padding-bottom: 150px;
`;

export const UserAnswerBlockComent = styled.h2`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
`;

export const UserAnswerScroll = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
`;

export const AnswerBox = styled.div`
  margin-bottom: 20px;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fff;
`;

export const StepBlock = styled.div`
  margin-bottom: 12px;
  padding: 8px;
  border-bottom: 1px solid #ddd;

  h3 {
    font-size: 16px;
    font-weight: bold;
  }

  p {
    font-size: 14px;
    margin: 4px 0;
  }
`;

export const ImagePreview = styled.img`
  max-width: 100%;
  height: auto;
  margin-top: 8px;
  border-radius: 6px;
  border: 1px solid #ddd;
`;

export const AcceptButton = styled.button`
  background-color: #007aff; /* 기본 파란색 */
  color: white;
  border: none;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;

  &:hover {
    background-color: #005ecb; /* 어두운 파란색 */
  }

  &:active {
    transform: scale(0.95);
  }

  /* :white_check_mark: 채택된 답변일 경우 스타일 변경 */
  ${({ disabled }) =>
    disabled &&
    `
    background-color: #bfbfbf; 
    cursor: not-allowed;
  `}
`;