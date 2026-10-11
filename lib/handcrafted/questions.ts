export type HandcraftedQuestion = {
  id: number;
  topic: string;
  subtopic: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
  choiceExplanations: string[];
};

export const handcraftedQuestions: HandcraftedQuestion[] = [
  {
    id: 1,
    topic: "약리학",
    subtopic: "자율신경계",
    prompt: "무스카린 수용체를 차단하여 산동을 유발하는 약물은?",
    choices: ["아트로핀", "필로카르핀", "네오스티그민", "베타네콜"],
    answer: 0,
    explanation:
      "아트로핀은 무스카린 수용체 길항제로 동공괄약근의 부교감 자극을 차단해 산동을 유발합니다.",
    choiceExplanations: [
      "무스카린 수용체를 경쟁적으로 차단하므로 정답입니다.",
      "무스카린 수용체 작용제로 축동을 유발합니다.",
      "아세틸콜린에스터레이스 억제제로 부교감 작용을 증가시킵니다.",
      "직접 작용 무스카린 효능제로 방광 수축에 사용됩니다.",
    ],
  },
  {
    id: 2,
    topic: "약리학",
    subtopic: "심혈관계",
    prompt: "ACE 억제제 복용 시 흔히 관찰되는 이상반응은?",
    choices: ["마른기침", "저혈당", "변비", "이명"],
    answer: 0,
    explanation:
      "ACE 억제로 브래디키닌 분해가 감소하면 마른기침이 나타날 수 있습니다.",
    choiceExplanations: [
      "브래디키닌 축적과 관련된 대표적 이상반응입니다.",
      "ACE 억제제의 대표적 이상반응이 아닙니다.",
      "흔한 계열 이상반응으로 분류되지 않습니다.",
      "살리실산계 약물에서 더 대표적으로 관찰됩니다.",
    ],
  },
  {
    id: 3,
    topic: "약리학",
    subtopic: "항균제",
    prompt: "세균의 세포벽 합성을 억제하는 항생제 계열은?",
    choices: [
      "베타락탐계",
      "마크로라이드계",
      "아미노글리코사이드계",
      "퀴놀론계",
    ],
    answer: 0,
    explanation:
      "베타락탐계 항생제는 펩티도글리칸 교차결합을 저해해 세포벽 합성을 방해합니다.",
    choiceExplanations: [
      "PBP에 결합해 세포벽 합성을 억제하므로 정답입니다.",
      "주로 50S 리보솜에 결합해 단백질 합성을 억제합니다.",
      "30S 리보솜에 작용해 단백질 합성을 방해합니다.",
      "DNA gyrase와 topoisomerase IV를 억제합니다.",
    ],
  },
  {
    id: 4,
    topic: "약제학",
    subtopic: "제제설계",
    prompt: "정제의 붕해를 촉진하기 위해 첨가하는 부형제는?",
    choices: ["붕해제", "결합제", "활택제", "착색제"],
    answer: 0,
    explanation:
      "붕해제는 수분을 흡수하거나 팽윤해 정제가 작은 입자로 빠르게 분산되도록 돕습니다.",
    choiceExplanations: [
      "정제의 붕해 시간을 단축하므로 정답입니다.",
      "분말 입자 사이의 결합력을 높입니다.",
      "타정 과정에서 마찰과 부착을 줄입니다.",
      "제제의 외관과 식별성을 개선합니다.",
    ],
  },
  {
    id: 5,
    topic: "약제학",
    subtopic: "생물약제학",
    prompt: "초회통과효과를 가장 직접적으로 피할 수 있는 투여 경로는?",
    choices: ["설하 투여", "경구 투여", "위관 투여", "십이지장 투여"],
    answer: 0,
    explanation:
      "설하 점막에서 흡수된 약물은 문맥을 거치지 않고 전신순환으로 들어가 초회통과효과를 피합니다.",
    choiceExplanations: [
      "설하정맥을 통해 전신순환으로 직접 이동하므로 정답입니다.",
      "흡수 후 문맥을 거쳐 간의 초회통과효과를 받습니다.",
      "위장관으로 투여되므로 경구 투여와 같은 영향을 받습니다.",
      "흡수된 약물이 문맥을 거치므로 초회통과효과를 피하지 못합니다.",
    ],
  },
  {
    id: 6,
    topic: "약제학",
    subtopic: "물리약학",
    prompt: "현탁제에서 입자의 침강 속도를 줄이는 방법으로 가장 적절한 것은?",
    choices: [
      "분산매의 점도를 높인다",
      "입자 크기를 키운다",
      "밀도 차이를 키운다",
      "중력을 증가시킨다",
    ],
    answer: 0,
    explanation:
      "Stokes 법칙에 따라 분산매의 점도가 증가하면 입자의 침강 속도는 감소합니다.",
    choiceExplanations: [
      "침강 속도는 점도에 반비례하므로 정답입니다.",
      "침강 속도는 입자 반지름의 제곱에 비례합니다.",
      "입자와 분산매의 밀도 차이가 커지면 더 빨리 침강합니다.",
      "중력이 커지면 침강 속도가 증가합니다.",
    ],
  },
];
