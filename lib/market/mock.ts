export type MarketItem = {
  id: string;
  title: string;
  subject: string;
  year: string;
  price: number;
  rating: number;
  purchaseCount: number;
  author: string;
  icon: string;
  description: string;
};

export const MARKET_SUBJECTS = [
  "전체",
  "약물학",
  "유기화학",
  "약제학",
  "병태생리",
  "생화학",
] as const;

export const MARKET_YEARS = [
  "전체",
  "1학년",
  "2학년",
  "3학년",
  "4학년",
  "5학년",
  "6학년",
  "국시",
] as const;

export const MARKET_ITEMS: MarketItem[] = [
  {
    id: "pharm-101",
    title: "약물학 전공 완벽 요약본",
    subject: "약물학",
    year: "3학년",
    price: 15000,
    rating: 4.9,
    purchaseCount: 312,
    author: "약학마스터",
    icon: "💊",
    description: "작용기전, 부작용, 임상사례를 시험 직전용으로 정리했어요.",
  },
  {
    id: "organic-quiz",
    title: "유기화학 한 장 정리",
    subject: "유기화학",
    year: "2학년",
    price: 9000,
    rating: 4.8,
    purchaseCount: 201,
    author: "유기화학신",
    icon: "🧪",
    description: "반응 메커니즘을 한 장 도식으로 압축한 암기 자료입니다.",
  },
  {
    id: "practice-pack",
    title: "약제학 핵심 200제",
    subject: "약제학",
    year: "4학년",
    price: 12000,
    rating: 4.7,
    purchaseCount: 156,
    author: "병원실습러",
    icon: "📗",
    description: "기출 빈도 분석 기반 문제와 해설을 묶었습니다.",
  },
  {
    id: "guksi-drug-100",
    title: "국시 빈출 약물 100선",
    subject: "약물학",
    year: "국시",
    price: 19000,
    rating: 5.0,
    purchaseCount: 478,
    author: "약사다되었네",
    icon: "📘",
    description: "최근 국시 빈출 약물을 빠르게 훑는 합격생 추천 자료입니다.",
  },
  {
    id: "pathophysiology-map",
    title: "병태생리 도식 정리",
    subject: "병태생리",
    year: "3학년",
    price: 11000,
    rating: 4.6,
    purchaseCount: 89,
    author: "약학마스터",
    icon: "🩺",
    description:
      "병태생리 핵심 개념을 도식으로 연결해 이해하기 쉽게 정리했어요.",
  },
  {
    id: "biochem-core",
    title: "생화학 핵심 개념",
    subject: "생화학",
    year: "1학년",
    price: 7000,
    rating: 4.5,
    purchaseCount: 67,
    author: "생화학조교",
    icon: "🧬",
    description: "생화학 입문자가 헷갈리는 개념을 중심으로 정리했습니다.",
  },
];
