import {
  longWord,
  openPractice,
  prepareStorage,
  expectNoHorizontalOverflow,
} from "../support/learning-layout";
import { mockScreenApis, waitForHydration } from "../support/screen-audit";

describe("기기별 학습 화면 레이아웃", () => {
  beforeEach(() => {
    mockScreenApis();
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
      cy.contains("button", "결과 보기").scrollIntoView().should("be.visible");
      expectNoHorizontalOverflow();
      if (width === 320) {
        cy.contains("button", "결과 보기").click();
        cy.contains("button", "이번 세트 오답 해설").click();
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

  it("긴 헤더 제목이 뒤로가기 및 오른쪽 슬롯과 겹치지 않는다", () => {
    cy.viewport(320, 568);
    cy.visit("/questionbank/generate", { onBeforeLoad: prepareStorage });
    waitForHydration();
    cy.get("header p").invoke(
      "text",
      "매우 긴 문제 모음 제목과 여러 과목 이름이 들어가는 경우",
    );
    cy.get("header").should(($header) => {
      const title = $header.find("p")[0].getBoundingClientRect();
      const back = $header.find('button[aria-label="이전 화면"]')[0];
      const rightSlot = $header[0].lastElementChild!;
      expect(title.left).to.be.at.least(back.getBoundingClientRect().right);
      expect(title.right).to.be.at.most(rightSlot.getBoundingClientRect().left);
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
