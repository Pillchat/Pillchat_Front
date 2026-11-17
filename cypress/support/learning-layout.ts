import type { Attempt, Grade } from "../../lib/learning/api";

export const longWord = "abcdefghijklmnopqrstuvwxyz".repeat(8);
const question = {
  attemptQuestionId: "layout-question",
  sourceQuestionVersionId: "layout-version",
  ordinal: 1,
  stem: `해당 환자에게 가장 적절한 치료약물은?\n${longWord}`,
  subjectName: "긴 과목 이름과 세부 주제 이름을 함께 표시하는 경우",
  referenceContent: "환자 정보와 검사 결과가 여러 줄로 표시됩니다.\n".repeat(
    12,
  ),
  choices: [
    "클로니딘",
    "딜티아젬",
    "미녹시딜",
    "클로르탈리돈",
    "프로프라놀롤",
  ].map((text, index) => ({
    choiceId: `choice-${index}`,
    text: `${text}\n${longWord}`,
  })),
  media: [],
};
const grade: Grade = {
  outcome: "INCORRECT",
  correctChoiceId: "choice-2",
  explanation: "긴 정답 해설\n".repeat(40),
  choices: question.choices.toReversed().map((choice) => ({
    ...choice,
    explanation: `${choice.text.split("\n")[0]}의 해설`,
  })),
};

export function openPractice(
  source: "HANDCRAFTED" | "CBT",
  options: { timed?: boolean } = {},
) {
  const attempt: Attempt = {
    attemptId: "layout-attempt",
    source,
    mode: "SESSION",
    state: "IN_PROGRESS",
    title: "기기별 레이아웃 확인용 문제",
    currentSectionId: "layout-section",
    currentQuestionId: question.attemptQuestionId,
    serverNow: new Date().toISOString(),
    resultAvailable: false,
    sections: [
      {
        sectionId: "layout-section",
        title: "1교시",
        state: "IN_PROGRESS",
        version: 1,
        scheduledStartAt: null,
        deadlineAt: options.timed
          ? new Date(Date.now() + 30 * 60_000).toISOString()
          : null,
      },
    ],
    currentSectionQuestions: [question],
    savedAnswers: [
      {
        attemptQuestionId: question.attemptQuestionId,
        selectedChoiceId: null,
        memo: "",
        flagged: false,
        excludedChoiceIds: [],
        version: 1,
        finalized: false,
      },
    ],
  };
  cy.intercept("GET", "**/api/learning/catalog*", { banks: [], subjects: [] });
  cy.intercept("GET", "**/api/learning/attempts?*", {
    items: [],
    nextCursor: null,
  });
  cy.intercept("GET", "**/api/learning/attempts/layout-attempt", attempt);
  cy.intercept(
    "PUT",
    "**/api/learning/attempts/layout-attempt/answers",
    (req) => {
      Object.assign(attempt.savedAnswers[0], req.body.updates[0]);
      attempt.savedAnswers[0].version++;
      req.reply({ attempt });
    },
  ).as("saveAnswer");
  cy.intercept(
    "POST",
    "**/api/learning/attempts/layout-attempt/questions/*/grade",
    (req) => {
      expect(req.body.selectedChoiceId).to.equal("choice-4");
      attempt.savedAnswers[0].finalized = true;
      attempt.state = "COMPLETED";
      attempt.resultAvailable = true;
      req.reply({ attempt, grade });
    },
  ).as("gradeAnswer");
  cy.intercept("GET", "**/api/learning/attempts/layout-attempt/result", {
    counts: { total: 1, correct: 0, incorrect: 1, unanswered: 0 },
    score: 0,
    questions: [
      {
        question,
        answer: { ...attempt.savedAnswers[0], selectedChoiceId: "choice-4" },
        grade,
      },
    ],
  });
  const route =
    source === "CBT" ? "/learning/cbt" : "/questionbank/handcrafted";
  cy.visit(`${route}?attempt=layout-attempt`, { onBeforeLoad: prepareStorage });
  cy.contains(question.stem.split("\n")[0])
    .scrollIntoView()
    .should("be.visible");
}

export function prepareStorage(win: Window) {
  const payload = win.btoa(
    JSON.stringify({
      sub: "layout-user",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  win.localStorage.setItem("access_token", `e30.${payload}.test`);
  for (const user of ["guest", "layout-user"])
    for (const kind of ["handcrafted", "cbt"])
      win.localStorage.setItem(
        `pillchat:tutorial:v1:${user}:${kind}`,
        "complete",
      );
}

export function expectNoHorizontalOverflow() {
  cy.document().should((doc) => {
    expect(doc.documentElement.scrollWidth).to.be.at.most(
      doc.documentElement.clientWidth + 1,
    );
    for (const button of doc.querySelectorAll("main button")) {
      expect(
        button.scrollWidth,
        button.textContent?.slice(0, 30),
      ).to.be.at.most(button.clientWidth + 1);
    }
  });
}
