import { useAtom } from "jotai";
import { studentInfoAtom, professionalInfoAtom } from "@/lib/atoms/onboarding";
import { useSubjects } from "./useSubjects";
import { filter, includes } from "lodash";

export const useOnboardingSubjects = (role: string, currentStep: number) => {
  const [studentInfo, setStudentInfo] = useAtom(studentInfoAtom);
  const [professionalInfo, setProfessionalInfo] = useAtom(professionalInfoAtom);

  const {
    getSubjectCodeByLabel,
    getSubjectLabelsByCodes,
    getSubjectMapForChips,
  } = useSubjects();

  // 현재 선택된 과목 코드들 가져오기
  const getSelectedSubjectCodes = (): string[] => {
    if (role === "professional") {
      return professionalInfo.strongSubjects;
    } else {
      if (currentStep === 3) {
        return studentInfo.weakSubjects; // ✅ Step 3이 어려운 과목
      } else if (currentStep === 4) {
        return studentInfo.courses.flatMap((course) => course.subjects);
      } else {
        return studentInfo.strongSubjects; // ✅ Step 2(또는 그 외)는 자신있는 과목
      }
    }
  };

  // 선택된 과목 코드들을 라벨로 변환 (UI 표시용)
  const getSelectedSubjectLabels = (): string[] => {
    const codes = getSelectedSubjectCodes();
    return getSubjectLabelsByCodes(codes);
  };

  // 과목 업데이트 함수
  const updateSubjectCodes = (codes: string[]) => {
    if (role === "professional") {
      setProfessionalInfo({ ...professionalInfo, strongSubjects: codes });
    } else {
      if (currentStep === 3) {
        setStudentInfo({ ...studentInfo, weakSubjects: codes });
      } else {
        setStudentInfo({ ...studentInfo, strongSubjects: codes });
      }
    }
  };

  // 과목 토글 핸들러
  const handleSubjectToggle = (subjectLabel: string) => {
    const subjectCode = getSubjectCodeByLabel(subjectLabel);
    if (!subjectCode) return;

    const currentCodes = getSelectedSubjectCodes();
    let newCodes: string[];

    if (includes(currentCodes, subjectCode)) {
      newCodes = filter(currentCodes, (code) => code !== subjectCode);
    } else if (currentCodes.length < 5) {
      newCodes = [...currentCodes, subjectCode];
    } else {
      return; // 5개 초과시 변경하지 않음
    }

    updateSubjectCodes(newCodes);
  };

  return {
    selectedSubjectLabels: getSelectedSubjectLabels(),
    subjectMapForChips: getSubjectMapForChips(),
    handleSubjectToggle,
  };
};
