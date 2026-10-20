import type { Attempt, Grade } from "../../lib/learning/api";

const longWord = "abcdefghijklmnopqrstuvwxyz".repeat(8);
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

function openPractice(source: "HANDCRAFTED" | "CBT") {
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
        deadlineAt: null,
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
  cy.contains(question.stem.split("\n")[0]).should("be.visible");
}

function prepareStorage(win: Window) {
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

function expectNoHorizontalOverflow() {
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

describe("기기별 학습 화면 레이아웃", () => {
  beforeEach(() => {
    cy.setCookie("access_token", "layout-test-only");
    cy.intercept("https://developers.kakao.com/**", { body: "" });
  });

  for (const [width, height] of [
    [320, 568],
    [375, 667],
    [390, 844],
    [667, 375],
    [744, 1024],
    [1280, 720],
  ]) {
    it(`수제 문제 ${width}×${height}: 긴 선지와 본문, 하단 채점 버튼`, () => {
      cy.viewport(width, height);
      openPractice("HANDCRAFTED");
      expectNoHorizontalOverflow();
      cy.contains("button", "프로프라놀롤").scrollIntoView().click();
      cy.wait("@saveAnswer")
        .its("request.body.updates.0.selectedChoiceId")
        .should("eq", "choice-4");
      cy.contains("button", "채점하기")
        .scrollIntoView()
        .should("be.visible")
        .click();
      cy.wait("@gradeAnswer");
      cy.contains("1. 클로니딘의 해설").should("exist");
      cy.contains("5. 프로프라놀롤의 해설").should("exist");
      cy.contains("button", "결과 확인").scrollIntoView().should("be.visible");
      expectNoHorizontalOverflow();
      if (width === 320) {
        cy.contains("button", "결과 확인").click();
        cy.contains("button", "복습하기").click();
        cy.contains("1. 클로니딘의 해설").should("exist");
        expectNoHorizontalOverflow();
      }
      cy.screenshot(`handcrafted-${width}x${height}`, { capture: "viewport" });
    });
  }

  for (const [width, height] of [
    [320, 568],
    [1280, 720],
  ]) {
    it(`CBT ${width}×${height}: 선택 번호와 답안 표기란`, () => {
      cy.viewport(width, height);
      openPractice("CBT");
      cy.get("header").should(($header) => {
        const bounds = $header[0].getBoundingClientRect();
        for (const p of $header.find("p")) {
          const rect = p.getBoundingClientRect();
          expect(rect.top).to.be.at.least(bounds.top);
          expect(rect.bottom).to.be.at.most(bounds.bottom);
        }
      });
      cy.get('button[aria-label="5번 선택지"]').scrollIntoView().click();
      cy.wait("@saveAnswer");
      cy.get('button[aria-label="5번 선택지, 선택됨"]').should(
        "have.attr",
        "aria-pressed",
        "true",
      );
      expectNoHorizontalOverflow();
      cy.screenshot(`cbt-${width}x${height}`, { capture: "viewport" });
    });
  }

  it("가로 모드에서 팝업 내용과 닫기 버튼에 접근할 수 있다", () => {
    cy.viewport(667, 375);
    openPractice("HANDCRAFTED");
    cy.get('button[aria-label="튜토리얼"]').click();
    cy.get('[role="dialog"]')
      .should(($dialog) => {
        const rect = $dialog[0].getBoundingClientRect();
        expect(rect.top).to.be.at.least(0);
        expect(rect.bottom).to.be.at.most(375);
      })
      .scrollTo("bottom");
    cy.get('[role="dialog"]').contains("button", "다음").should("be.visible");
    cy.contains("button", "Close").scrollIntoView().click();
    cy.get('[role="dialog"]').should("not.exist");
  });

  it("글자 크기가 커져도 긴 선지와 채점 버튼을 사용할 수 있다", () => {
    cy.viewport(320, 568);
    openPractice("HANDCRAFTED");
    cy.document().then((doc) => {
      doc.documentElement.style.fontSize = "20px";
    });
    cy.contains("button", "프로프라놀롤").scrollIntoView().click();
    cy.wait("@saveAnswer");
    expectNoHorizontalOverflow();
    cy.contains("button", "채점하기").scrollIntoView().should("be.visible");
  });

  it("긴 헤더 제목이 뒤로가기 및 홈 버튼과 겹치지 않는다", () => {
    cy.viewport(320, 568);
    cy.visit("/questionbank/generate", { onBeforeLoad: prepareStorage });
    cy.get("header p").invoke(
      "text",
      "매우 긴 문제 모음 제목과 여러 과목 이름이 들어가는 경우",
    );
    cy.get("header").should(($header) => {
      const title = $header.find("p")[0].getBoundingClientRect();
      const buttons = $header.find("button");
      expect(title.left).to.be.at.least(
        buttons[0].getBoundingClientRect().right,
      );
      expect(title.right).to.be.at.most(
        buttons[1].getBoundingClientRect().left,
      );
    });
    expectNoHorizontalOverflow();
  });

  it("긴 닉네임과 학교명이 프로필 사진과 편집 버튼을 밀어내지 않는다", () => {
    cy.viewport(320, 568);
    cy.intercept("GET", "**/api/auth/inquiry-myprofile", {
      success: true,
      data: {
        id: "layout-user",
        nickname: longWord,
        school: longWord,
        studentGrade: "6학년",
      },
    });
    cy.intercept("GET", "**/api/attendance", { grade: "GOSU", totalDays: 100 });
    cy.intercept("GET", "**/api/users/layout-user/follow-summary", {
      followerCount: 0,
      followingCount: 0,
    });
    cy.visit("/mypage", { onBeforeLoad: prepareStorage });
    cy.get('img[alt="프로필 편집"]').should("exist");
    cy.get('img[alt="profile"]')
      .parent()
      .should(($photo) => {
        const bounds = $photo[0].getBoundingClientRect();
        expect(bounds.width).to.equal(68);
        expect(bounds.height).to.equal(68);
      });
    expectNoHorizontalOverflow();
  });

  it("좁은 화면에서 검색 입력과 검색 아이콘이 모두 표시된다", () => {
    cy.viewport(320, 568);
    cy.intercept("GET", "**/api/questions?*", []);
    cy.intercept("GET", /\/api\/notifications(?:\/|\?|$)/, {
      items: [],
      unreadCount: 0,
      nextCursor: null,
      snapshotSequence: "1",
    });
    cy.visit("/qna", { onBeforeLoad: prepareStorage });
    cy.get('header img[alt="search"]').click();
    cy.get('input[placeholder="검색어 입력"]').type(longWord);
    cy.get("header").should(($header) => {
      const input = $header.find("input")[0].getBoundingClientRect();
      const icon = $header.find('img[alt="search"]')[0].getBoundingClientRect();
      expect(input.right).to.be.at.most(icon.left);
      expect(icon.width).to.equal(32);
    });
    expectNoHorizontalOverflow();
  });
});
