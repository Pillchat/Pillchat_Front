import {
  expectNoHorizontalOverflow,
  prepareStorage,
} from "../support/learning-layout";
import { mockScreenApis } from "../support/screen-audit";

const preview = () => cy.contains("h2", "오늘의 문제").closest("section");

function press(text: string | RegExp) {
  preview().contains("button", text).scrollIntoView().click();
}

function capture(state: string, focused = false) {
  if (!Cypress.env("screenAudit")) return;

  cy.document().then((doc) => {
    const style = doc.createElement("style");
    style.textContent =
      "nextjs-portal { display: none } html { scrollbar-width: none }";
    doc.head.append(style);
  });
  if (focused) {
    preview().then((section) => {
      const element = section[0];
      element.ownerDocument.defaultView?.scrollBy(
        0,
        element.getBoundingClientRect().top - 86,
      );
    });
  } else {
    cy.scrollTo("top");
  }
  cy.screenshot(`home-preview-${state}`, { capture: "viewport" });
}

describe("홈 미리보기 문제", () => {
  beforeEach(() => {
    mockScreenApis();
    cy.clock(Date.UTC(2026, 10, 20, 14, 55), ["Date"]);
    cy.setCookie("access_token", "layout-test-only");
    cy.visit("/", { onBeforeLoad: prepareStorage });
  });

  it("단원을 골라 홈에서 채점하고 새로고침 후 이어서 푼다", () => {
    cy.viewport(390, 844);
    press("직접 과목·단원 선택");
    preview().contains("label", "전체 단원").click();
    preview()
      .contains("button", /^문제 풀기$/)
      .should("be.disabled");
    press("닫기");
    press("직접 과목·단원 선택");
    preview().contains("label", "내분비").click();
    preview()
      .contains("label", "전체 단원")
      .find("input")
      .should("have.prop", "indeterminate", true);
    preview().contains("새 문제 3개").should("be.visible");
    capture("scope");
    press(/^3문제 풀기$/);
    preview().contains("약물치료학 · 위장관").should("be.visible");
    preview().contains("1 / 3").should("be.visible");
    preview().find('input[type="radio"]').should("have.length", 5);
    preview().contains("button", "정답 확인").should("be.disabled");

    preview().find('input[value="B"]').check();
    preview().find('[role="status"]').should("not.exist");
    capture("selected");
    press("정답 확인");
    preview().find('[role="status"]').should("contain.text", "오답이에요");
    preview().contains("정답 C: 수크랄페이트").should("be.visible");
    capture("graded", true);

    cy.reload();
    preview().contains("2 / 3").should("be.visible");
    preview().find('input[value="A"]').check();
    cy.reload();
    preview().contains("2 / 3").should("be.visible");
    preview().contains("button", "정답 확인").should("be.disabled");
    preview().find('input[value="C"]').check();
    press("정답 확인");
    preview().find('[role="status"]').should("contain.text", "정답이에요");
    press("다음 문제");
    preview().find('input[value="A"]').check();
    press("정답 확인");
    press("결과 보기");
    preview().contains("3문제 중 2문제를 맞혔어요.").should("be.visible");
    cy.contains("h2", "오늘의 학습 현황").should("exist");
    press("추가문제풀기");
    cy.location("pathname").should("eq", "/questionbank/handcrafted");
    cy.contains("header", "전문검수문제").should("be.visible");
    cy.go("back");
    preview()
      .contains("오늘의 미리보기 3문제를 모두 풀었어요.")
      .should("be.visible");
    cy.reload();
    preview()
      .contains("오늘의 미리보기 3문제를 모두 풀었어요.")
      .should("be.visible");
    preview().contains("button", "직접 과목·단원 선택").should("not.exist");

    cy.clock().invoke("restore");
    cy.clock(Date.UTC(2026, 10, 20, 15, 0), ["Date"]);
    cy.reload();
    press("추천 미리보기 3문제 풀기");
    preview().contains("약물치료학 · 위장관").should("be.visible");
    preview().contains("1 / 3").should("be.visible");
  });

  it("320px 홈에서 추천 세트를 열고 양쪽 단원 문제를 풀 수 있다", () => {
    cy.viewport(320, 568);
    press("추천 미리보기 3문제 풀기");
    preview().contains("1 / 3").should("be.visible");
    preview()
      .contains(/약물치료학 · (내분비|위장관)$/)
      .then(($chapter) => {
        cy.wrap($chapter.text()).as("firstChapter");
      });
    expectNoHorizontalOverflow();
    preview().find('input[value="A"]').check();
    press("정답 확인");
    press("다음 문제");
    cy.get("@firstChapter").then((chapter) => {
      preview()
        .contains(/약물치료학 · (내분비|위장관)$/)
        .should("not.have.text", chapter);
    });
    expectNoHorizontalOverflow();
  });

  it("상황 설명은 본문으로 표시하고 마지막 질문만 강조한다", () => {
    cy.viewport(390, 844);
    press("직접 과목·단원 선택");
    preview().contains("label", "위장관").click();
    press(/^3문제 풀기$/);

    preview()
      .contains(
        "h3",
        "이 정보를 바탕으로 할 때 처방된 인슐린으로 적절한 것은 무엇인가?",
      )
      .should("have.css", "font-weight", "600")
      .and("have.css", "font-size", "16px")
      .then(($prompt) => {
        const contextId = $prompt.attr("aria-describedby");
        expect(contextId).to.be.a("string");
        preview()
          .find(`[id="${contextId}"]`)
          .should("contain.text", "48세 남자가 약국에 방문하여")
          .and("have.css", "font-weight", "400")
          .and("have.css", "line-height", "26px");
      });

    preview().find('input[value="B"]').check();
    expectNoHorizontalOverflow();
    capture("conclusion-only");
    capture("conclusion-only-detail", true);
    press("정답 확인");
    preview().find('[role="status"]').should("contain.text", "오답이에요");
  });
});
