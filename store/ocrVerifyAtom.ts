import { atom } from "jotai";

export interface OCRVerificationData {
  success: boolean;
  tempToken: string;
  documentType: string;
  fields: {
    name: string;
    studentId: string;
    university: string;
    licenseNumber: string | null;
    issueDate: string | null;
    department: string | null;
  };
  message: string;
}

export const ocrVerificationAtom = atom<OCRVerificationData | null>(null);
