export const QUESTION_FORM_RULES = {
  title: {
    required: "제목을 입력해주세요.",
    minLength: {
      value: 2,
      message: "제목은 2글자 이상 입력해주세요.",
    },
    maxLength: {
      value: 100,
      message: "제목은 100글자 이하로 입력해주세요.",
    },
  },
  content: {
    required: "내용을 입력해주세요.",
    minLength: {
      value: 10,
      message: "내용은 10글자 이상 입력해주세요.",
    },
  },
  subject: {
    required: "과목을 선택해주세요.",
  },
  reward: {
    required: "팜머니를 입력해주세요.",
    pattern: {
      value: /^\d+$/,
      message: "숫자만 입력해주세요.",
    },
    min: {
      value: 1,
      message: "1 이상의 값을 입력해주세요.",
    },
  },
} as const;
