import { prepareStorage } from "../support/learning-layout";
import { mockScreenApis } from "../support/screen-audit";

const accountProgress = "pillchat:tutorial:v1:layout-user:handcrafted";
const guestProgress = "pillchat:tutorial:v1:guest:handcrafted";

function openSignedIn(path: string, onBeforeLoad = prepareStorage) {
  cy.setCookie("access_token", "layout-test-only");
  cy.visit(path, { onBeforeLoad });
}

function openFirstTutorial(path: string, kind: string) {
  openSignedIn(path, (win) => {
    prepareStorage(win);
    for (const scope of ["layout-user", "guest"]) {
      win.localStorage.removeItem(`pillchat:tutorial:v1:${scope}:${kind}`);
    }
  });
}

function expectCompletionAfterReload(
  kind: string,
  finishLabel: string,
  headerLabel: string,
) {
  cy.contains("button", finishLabel).should("be.visible");
  cy.window().should((win) => {
    expect(
      win.localStorage.getItem(`pillchat:tutorial:v1:layout-user:${kind}`),
    ).to.equal("complete");
  });
  cy.reload();
  cy.contains("header", headerLabel).should("be.visible");
  cy.contains("button", finishLabel).should("not.exist");
}

function nextInGuide() {
  cy.contains("aside button", /^다음$/).click();
}

function expectViewportWidth(selector: string) {
  cy.get(selector).should(([element]) => {
    const bounds = element.getBoundingClientRect();
    const width = element.ownerDocument.documentElement.clientWidth;
    expect(bounds.left).to.be.closeTo(0, 1);
    expect(bounds.right).to.be.closeTo(width, 1);
  });
}

describe("태블릿 화면, 로그인 보호와 튜토리얼", () => {
  beforeEach(() => mockScreenApis());

  it("아이패드 가로·세로와 분할 화면에서 상단과 하단이 같은 폭을 사용한다", () => {
    cy.viewport(834, 1194);
    openSignedIn("/");
    for (const [width, height] of [
      [834, 1194],
      [1194, 834],
      [1376, 1032],
      [700, 900],
    ]) {
      cy.viewport(width, height);
      expectViewportWidth("header");
      expectViewportWidth("[data-bottom-navigation]");
    }
    cy.visit("/upload");
    expectViewportWidth("header");
    cy.visit("/learning/history");
    expectViewportWidth("header");
  });

  it("로그아웃 상태에서 학습, 플래시카드와 일반 페이지를 로그인으로 보낸다", () => {
    for (const path of [
      "/learn",
      "/learning/cbt",
      "/flashcards",
      "/flashcards/tutorial",
      "/question/item.with-dot",
      "/mypage",
    ]) {
      cy.request({ url: path, followRedirect: false }).then((response) => {
        expect(response.status, path).to.equal(307);
        expect(new URL(String(response.headers.location)).pathname).to.equal(
          "/login",
        );
      });
    }
    cy.visit("/learning/history?filter=wrong");
    cy.location("pathname").should("eq", "/login");
    cy.location("search").should((search) => {
      expect(new URLSearchParams(search).get("returnTo")).to.equal(
        "/learning/history?filter=wrong",
      );
    });
    cy.request({ url: "/icons/home.svg", followRedirect: false })
      .its("status")
      .should("eq", 200);
  });

  it("쿠키만 남은 탭도 로그인으로 돌아간다", () => {
    cy.setCookie("access_token", "stale-cookie-only");
    cy.visit("/flashcards");
    cy.location("pathname").should("eq", "/login");
  });

  it("예전에 완료한 튜토리얼은 로그인 후에도 다시 나오지 않는다", () => {
    openSignedIn("/questionbank/handcrafted", (win) => {
      prepareStorage(win);
      win.localStorage.removeItem(accountProgress);
    });
    cy.contains("header", "전문검수문제").should("be.visible");
    cy.contains("전문검수문제 사용법").should("not.exist");
    cy.window().should((win) => {
      expect(win.localStorage.getItem(accountProgress)).to.equal("complete");
      expect(win.localStorage.getItem(guestProgress)).to.equal(null);
    });
    cy.reload();
    cy.contains("header", "전문검수문제").should("be.visible");
    cy.contains("전문검수문제 사용법").should("not.exist");
  });

  it("전문검수문제 연습을 완료하면 마지막 버튼을 누르기 전에도 저장된다", () => {
    cy.viewport(834, 1194);
    openFirstTutorial("/questionbank/handcrafted", "handcrafted");
    cy.contains("전문검수문제 사용법 · 1/5").should("be.visible");
    cy.reload();
    cy.contains("전문검수문제 사용법 · 1/5").should("be.visible");
    cy.contains("button", "아트로핀").click();
    cy.contains("button", /^다음$/).click();
    cy.get('button[aria-label="북마크"]').click();
    cy.get('button[aria-label="북마크 해제"]').click();
    cy.contains("button", /^다음$/).click();
    cy.contains("button", "채점하기").click();
    cy.contains("button", /^다음$/)
      .scrollIntoView()
      .click();
    cy.contains("button", "약리학 예제 문제 모음").click();
    cy.contains("button", "북마크 문제 복습").click();
    cy.contains("button", /^다음$/).click();
    expectCompletionAfterReload("handcrafted", "연습 마치기", "전문검수문제");
  });

  it("플래시카드 연습을 완료하면 마지막 버튼을 누르기 전에도 저장된다", () => {
    cy.viewport(834, 1194);
    openFirstTutorial("/flashcards", "flashcards");
    for (const title of [
      "다른 카드팩을 골라보세요",
      "카드를 눌러보세요",
      "기억했어요를 눌러보세요",
      "다시 볼래요를 눌러보세요",
    ]) {
      cy.contains("aside h2", title).should("be.visible");
      nextInGuide();
    }
    expectCompletionAfterReload(
      "flashcards",
      "내 카드로 학습하기",
      "AI 플래시카드",
    );
  });

  it("CBT 연습을 완료하면 마지막 버튼을 누르기 전에도 저장된다", () => {
    cy.viewport(1280, 900);
    cy.intercept("GET", "**/api/cbt/practice?session=tutorial", (req) =>
      req.continue(),
    );
    openFirstTutorial("/learning/cbt", "cbt");

    for (const step of ["answer", "check", "unknown"]) {
      cy.get(`[data-cbt-tutorial="${step}"]`)
        .filter(":visible")
        .first()
        .click();
      nextInGuide();
    }
    cy.get('[data-cbt-tutorial="memo"]').filter(":visible").first().click();
    cy.get('[data-cbt-tutorial="memo-input"] textarea').type("연습 메모");
    nextInGuide();

    cy.get('[data-cbt-tutorial="calculator"]').filter(":visible").click();
    for (const key of [/^1$/, /^\+$/, /^1$/, /^=$/]) {
      cy.contains('[data-cbt-tutorial="calculator-panel"] button', key).click();
    }
    nextInGuide();

    cy.get('[data-cbt-tutorial="navigate"]').filter(":visible").click();
    nextInGuide();
    cy.get('[data-cbt-tutorial="review"]').filter(":visible").click();
    cy.get('[data-cbt-tutorial="submit-panel"]').should("be.visible");
    nextInGuide();
    expectCompletionAfterReload("cbt", "연습 마치기", "약사국시 CBT 실전 연습");
  });
});
