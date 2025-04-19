import styled from "styled-components";

export const QC = styled.textarea`
  position: relative;
  width: 80%;
  left: 20px;
  font-family: Pretendard, sans-serif;
  font-size: 20px;
  font-weight: 700;

  color: black;
  background-color: white;

  resize: none; // 크기 조정 불가능
  overflow: hidden; // 내용이 많아도 스크롤을 숨김
  border: none;
  outline: none;

  display: inline-block; /* inline-block 설정 */
  vertical-align: top; /* 상단 정렬 */

  padding-left: 10px;
  padding-right: 10px;

  display: inline-block;
`;
