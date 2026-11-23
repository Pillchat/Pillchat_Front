import {
  openPractice,
  prepareStorage,
  expectNoHorizontalOverflow,
} from "../support/learning-layout";
import {
  mockScreenApis,
  checkHorizontalBounds,
  checkReachable,
} from "../support/screen-audit";

// CSS viewport sizes, not physical-device or OS emulation.
const sizes = [
  ["small-phone", 320, 568],
  ["iphone", 390, 844],
  ["galaxy-phone", 360, 800],
  ["large-phone", 412, 915],
  ["phone-landscape", 844, 390],
  ["ipad-mini-portrait", 744, 1133],
  ["ipad-portrait", 834, 1194],
  ["ipad-landscape", 1194, 834],
  ["ipad-split", 507, 768],
  ["galaxy-tab-portrait", 800, 1280],
  ["galaxy-tab-landscape", 1280, 800],
] as const;

function visitSignedIn(path: string) {
  cy.setCookie("access_token", "layout-test-only");
  cy.visit(path, { onBeforeLoad: prepareStorage });
}

describe("브라우저 화면 크기별 점검 (실기기 검증 아님)", () => {
  beforeEach(() => mockScreenApis());

  for (const [name, width, height] of sizes) {
    const id = `${name}-${width}x${height}`;

    it(`${id}: 로그인 필드와 하단 버튼`, () => {
      cy.viewport(width, height);
      cy.visit("/login");
      cy.contains("button", "Google로 로그인").should("not.be.disabled");
      cy.get('input[placeholder="이메일을 입력해주세요"]').type(
        "screen-audit@example.invalid",
      );
      cy.get('input[placeholder="비밀번호를 입력해주세요"]').type(
        "ScreenAudit123!",
      );
      cy.contains("button", /^로그인$/).should("not.be.disabled");
      checkHorizontalBounds();
      checkReachable('button[type="submit"]');
      cy.contains("button", "카카오로 로그인")
        .scrollIntoView()
        .should("be.visible");
      cy.screenshot(`login-${id}`, { capture: "viewport" });
    });

    it(`${id}: 홈 학습 현황·공지·하단 메뉴`, () => {
      cy.viewport(width, height);
      visitSignedIn("/");
      cy.contains("20문제").should("be.visible");
      cy.get('[aria-label="홈 공지사항"]').should("be.visible");
      cy.contains("h2", "학습 바로가기").scrollIntoView().should("be.visible");
      checkHorizontalBounds();
      checkReachable('nav a[href="/mypage"]');
      cy.scrollTo("top", { ensureScrollable: false });
      cy.screenshot(`home-${id}`, { capture: "viewport" });
    });

    it(`${id}: 질문 작성 필드·과목·등록 버튼`, () => {
      cy.viewport(width, height);
      visitSignedIn("/ask");
      cy.get('input[placeholder="제목을 입력해주세요."]').type(
        "기기별 화면 점검용 질문 제목",
      );
      cy.get("textarea").type(
        "긴 질문 본문이 줄바꿈되고 입력 영역에 표시되는지 확인합니다. ".repeat(
          8,
        ),
        { delay: 0 },
      );
      cy.contains("button", "약사법규").scrollIntoView().should("be.visible");
      checkHorizontalBounds();
      checkReachable("header button:last-child");
      cy.screenshot(`ask-${id}`, { capture: "viewport" });
    });

    it(`${id}: 학습자료 작성·첨부 미리보기·업로드 버튼`, () => {
      cy.viewport(width, height);
      visitSignedIn("/upload");
      cy.get('input[placeholder="제목을 입력해주세요."]').type(
        "기기별 화면 점검용 학습자료",
      );
      cy.get("textarea").type(
        "자료 설명이 화면에 맞춰 줄바꿈되는지 확인합니다. ".repeat(6),
        { delay: 0 },
      );
      cy.contains("button", "약물학").click();
      cy.get('input[type="file"][accept*="image/png"]').selectFile(
        "public/illustrations/pill-loader-sprite.png",
        { force: true },
      );
      cy.get('img[alt="pill-loader-sprite.png"]').should("exist");
      checkHorizontalBounds();
      cy.contains("button", "업로드하기")
        .scrollIntoView()
        .should("be.visible")
        .and("not.be.disabled");
      cy.screenshot(`upload-${id}`, { capture: "viewport" });
    });

    it(`${id}: 전문검수문제 긴 본문·선지·채점 결과`, () => {
      cy.viewport(width, height);
      cy.setCookie("access_token", "layout-test-only");
      openPractice("HANDCRAFTED");
      expectNoHorizontalOverflow();
      cy.contains("button", "프로프라놀롤").scrollIntoView().click();
      cy.wait("@saveAnswer");
      cy.contains("button", "채점하기").scrollIntoView().click();
      cy.wait("@gradeAnswer");
      cy.contains("button", "결과 보기").scrollIntoView().should("be.visible");
      expectNoHorizontalOverflow();
      cy.screenshot(`handcrafted-${id}`, { capture: "viewport" });
    });

    it(`${id}: CBT 문제·답안 패널·하단 제출 버튼`, () => {
      cy.viewport(width, height);
      cy.setCookie("access_token", "layout-test-only");
      openPractice("CBT");
      cy.get('button[aria-label="5번 선택지"]').scrollIntoView().click();
      cy.wait("@saveAnswer");
      cy.get('button[aria-label="5번 선택지, 선택됨"]').should(
        "have.attr",
        "aria-pressed",
        "true",
      );
      cy.get('aside[aria-label="답안 표기란"]').should(
        width >= 1024 ? "be.visible" : "not.be.visible",
      );
      checkHorizontalBounds();
      cy.get("footer button")
        .filter(":visible")
        .contains("답안 제출")
        .should("be.visible");
      cy.screenshot(`cbt-${id}`, { capture: "viewport" });
    });

    it(`${id}: CBT 계산기 팝업과 닫기 버튼이 화면 안에 표시`, () => {
      cy.viewport(width, height);
      cy.setCookie("access_token", "layout-test-only");
      openPractice("CBT");
      cy.get("footer button").filter(":visible").contains("계산기").click();
      cy.get('[role="dialog"]').should("be.visible");
      cy.screenshot(`calculator-${id}`, { capture: "viewport" });
      checkReachable('[role="dialog"] button[aria-label="닫기"]');
      cy.get('[role="dialog"] > section').should(($el) => {
        const box = $el[0].getBoundingClientRect();
        expect(box.top, "dialog top").to.be.at.least(0);
        expect(box.bottom, "dialog bottom").to.be.at.most(height);
      });
      // The last row must be usable after scrolling, with the close button
      // still reachable above the independently scrolling calculator body.
      cy.contains('[role="dialog"] button', /^2$/).scrollIntoView().click();
      cy.contains('[role="dialog"] button', /^\+$/).scrollIntoView().click();
      cy.contains('[role="dialog"] button', /^3$/).scrollIntoView().click();
      cy.contains('[role="dialog"] button', /^=$/).scrollIntoView().click();
      cy.get('[role="dialog"] [role="status"]').should(
        "have.attr",
        "aria-label",
        "계산식 2 + 3 = 5. 계산 값 5",
      );
      checkReachable('[role="dialog"] button[aria-label="닫기"]');
      cy.get('[role="dialog"] button[aria-label="닫기"]').click();
      cy.get('[role="dialog"]').should("not.exist");
    });
  }

  it("CBT iPad 세로 → 가로 → 분할: 선택 답안 유지 및 패널 전환", () => {
    cy.viewport(834, 1194);
    cy.setCookie("access_token", "layout-test-only");
    openPractice("CBT");
    cy.get('button[aria-label="5번 선택지"]').scrollIntoView().click();
    cy.wait("@saveAnswer");
    for (const [width, height] of [
      [1194, 834],
      [507, 768],
      [834, 1194],
    ]) {
      cy.viewport(width, height);
      cy.get('button[aria-label="5번 선택지, 선택됨"]').should(
        "have.attr",
        "aria-pressed",
        "true",
      );
      cy.get('aside[aria-label="답안 표기란"]').should(
        width >= 1024 ? "be.visible" : "not.be.visible",
      );
      checkHorizontalBounds();
      cy.screenshot(`cbt-resize-${width}x${height}`, { capture: "viewport" });
    }
  });

  for (const width of [1023, 1024, 1179, 1180]) {
    it(`CBT ${width}px: 반응형 경계`, () => {
      cy.viewport(width, 768);
      cy.setCookie("access_token", "layout-test-only");
      openPractice("CBT");
      cy.get('aside[aria-label="답안 표기란"]').should(
        width >= 1024 ? "be.visible" : "not.be.visible",
      );
      checkHorizontalBounds();
    });
  }

  for (const width of [320, 360, 390, 412]) {
    for (const timed of [false, true]) {
      it(`CBT ${width}px: ${timed ? "시간 제한 있음" : "시간 제한 없음"} 헤더 조작`, () => {
        cy.viewport(width, 844);
        cy.setCookie("access_token", "layout-test-only");
        openPractice("CBT", { timed });
        cy.screenshot(`cbt-header-${width}-${timed ? "timed" : "unlimited"}`, {
          capture: "viewport",
        });
        checkHorizontalBounds();
        cy.get('header [aria-label="문제 화면 배치"]')
          .contains("button", "1문제")
          .click()
          .should("have.attr", "aria-pressed", "true");
        cy.get('header [aria-label="문제 화면 배치"]')
          .contains("button", "2문제")
          .click()
          .should("have.attr", "aria-pressed", "true");
        checkReachable('header button[aria-label="튜토리얼"]');
        checkReachable('header button[aria-label="시험 나가기"]');
        cy.get('header button[aria-label="시험 나가기"]').click();
        cy.contains('[role="dialog"] button', "계속 풀기").click();
        cy.get('[role="dialog"]').should("not.exist");
      });
    }
  }

  for (const [width, height] of [
    [320, 568],
    [844, 390],
    [667, 320],
  ]) {
    it(`CBT ${width}×${height}: 제출·나가기 팝업의 하단 버튼과 닫기`, () => {
      cy.viewport(width, height);
      cy.setCookie("access_token", "layout-test-only");
      openPractice("CBT");
      cy.get("footer button").filter(":visible").contains("답안 제출").click();
      cy.contains('[role="dialog"] button', "계속 풀기")
        .scrollIntoView()
        .should("be.visible");
      checkReachable('[role="dialog"] button[aria-label="닫기"]');
      cy.contains('[role="dialog"] button', "계속 풀기").click();
      cy.get('header button[aria-label="시험 나가기"]').click();
      cy.contains('[role="dialog"] button', "저장하고 나가기")
        .scrollIntoView()
        .should("be.visible");
      checkReachable('[role="dialog"] button[aria-label="닫기"]');
      cy.get('[role="dialog"] button[aria-label="닫기"]').click();
      cy.get('[role="dialog"]').should("not.exist");
    });
  }
});
