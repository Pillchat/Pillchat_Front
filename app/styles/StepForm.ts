import styled from "styled-components";
import { Camera, Trash } from "lucide-react";

export const Container = styled.div`
  width: 90%;
  margin: 0 auto;
  padding: 16px;
`;

export const StepBox = styled.div`
  border: 1px solid #ddd;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
`;

export const StepHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
`;

export const Icons = styled.div`
  display: flex;
  gap: 10px;
`;

export const CameraIcon = styled(Camera)`
  cursor: pointer;
  width: 20px;
  height: 20px;
  color: #555;
`;

export const TrashIcon = styled(Trash)`
  cursor: pointer;
  width: 20px;
  height: 20px;
  color: red;
`;

export const TextArea = styled.textarea`
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: none;
  font-size: 14px;
`;

export const AddStepButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px;
  background: #f5f5f5;
  border: none;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
`;

export const SubmitButton = styled.button`
  width: 100%;
  padding: 10px;
  background: red;
  color: white;
  font-size: 16px;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  margin-top: 10px;
`;
