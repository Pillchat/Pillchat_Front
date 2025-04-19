export interface Subject {
  name: string;
  id: number;
}

// 과목명과 과목 ID 매핑
export const subjectMap: Record<string, number> = {
  약사윤리: 1,
  생화학: 2,
  미생물학: 3,
  물리약학: 4,
  의약품분석학: 5,
  약물치료학: 6,
  해부생리학: 7,
  약물학: 8,
  의약품합성학: 9,
  생약학: 10,
  약제학: 11,
  약물동태학: 12,
  병태생리학: 13,
  면역학: 14,
  보건사회약학: 15,
  독성학: 16,
};

// subjectMap을 기반으로 과목 목록 배열 생성
export const subjects: Subject[] = Object.keys(subjectMap).map((subject) => ({
  name: subject,
  id: subjectMap[subject],
}));
