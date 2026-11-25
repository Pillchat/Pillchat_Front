import { openPractice } from "../support/learning-layout";
import { mockScreenApis } from "../support/screen-audit";

// Bridge and visual-viewport simulation, not a physical keyboard/device test.
describe("기존 화면의 앱 이벤트 대응", () => {
  let events: Map<string, (params?: { isConnected?: boolean }) => void>;
  let back: Map<string, (id: string) => void>;
  let viewport: EventTarget & {
    height: number;
    offsetTop: number;
    scale: number;
  };

  beforeEach(() => {
    mockScreenApis();
    cy.setCookie("access_token", "layout-test-only");
    cy.viewport(390, 844);
    events = new Map();
    back = new Map();
    cy.on("window:before:load", (win) => {
      viewport = Object.assign(new win.EventTarget(), {
        height: 844,
        offsetTop: 0,
        scale: 1,
      });
      Object.defineProperty(win, "visualViewport", {
        configurable: true,
        value: viewport,
      });
      win.Nachocode = {
        initAsync: async () => {},
        env: { isApp: () => true },
        permission: {
          checkPermission: (_options, callback) => callback(false),
        },
        push: {
          registerPushToken: async () => ({ status: "success" }),
          deletePushToken: async () => ({ status: "success" }),
          sendLocalPush: (_options, callback) =>
            callback({ status: "success" }),
          cancelLocalPush: () => {},
        },
        event: {
          on: (name, callback) => {
            events.set(name, callback);
          },
        },
        backkey: {
          addEvent: (callback, id = "test") => {
            back.set(id, callback);
            return id;
          },
          removeEvent: (id) => {
            if (id) back.delete(id);
          },
        },
      } as NonNullable<Window["Nachocode"]>;
    });
  });

  it("안드로이드 뒤로 가기는 계산기를 닫고 다음에는 시험 나가기 확인을 표시", () => {
    openPractice("CBT");
    cy.get("footer button").filter(":visible").contains("계산기").click();
    cy.get('[role="dialog"]').should("be.visible");
    cy.get("body").should("have.attr", "data-scroll-locked");
    cy.then(() => back.get("pillchat:back")!("pillchat:back"));
    cy.get('[role="dialog"]').should("not.exist");
    cy.get("body").should("not.have.attr", "data-scroll-locked");
    cy.then(() => back.get("pillchat:back")!("pillchat:back"));
    cy.get('[role="dialog"]').should("contain", "시험을 나갈까요?");
    cy.contains('[role="dialog"] button', "계속 풀기").click();
    cy.get('[role="dialog"]').should("not.exist");
    cy.contains("footer button", "문제 목록").click();
    cy.get('[role="dialog"]').should("contain", "문제 목록");
    cy.then(() => back.get("pillchat:back")!("pillchat:back"));
    cy.get('[role="dialog"]').should("not.exist");
  });

  it("키보드로 가시 영역이 줄면 팝업을 그 영역 안에 배치하고 닫히면 복원", () => {
    openPractice("CBT");
    cy.get("footer button").filter(":visible").contains("계산기").click();
    cy.window().then((win) => {
      viewport.height = 380;
      events.get("keyboardshown")!();
      viewport.dispatchEvent(new win.Event("resize"));
    });
    cy.get("html").should("have.attr", "data-keyboard-open", "true");
    cy.get('[role="dialog"] > section').should(($section) => {
      const rect = $section[0].getBoundingClientRect();
      expect(rect.top).to.be.at.least(0);
      expect(rect.bottom).to.be.at.most(380);
    });
    cy.window().then((win) => {
      viewport.height = 844;
      events.get("keyboardhidden")!();
      viewport.dispatchEvent(new win.Event("resize"));
    });
    cy.get("html").should("have.attr", "data-keyboard-open", "false");
    cy.get('[role="dialog"] button[aria-label="닫기"]').click();
    cy.get('[role="dialog"]').should("not.exist");
  });

  it("앱 복귀 즉시 서버 응시 상태를 다시 읽음", () => {
    const attempt = openPractice("CBT", { timed: true });
    cy.intercept("GET", "**/api/learning/attempts/layout-attempt", (req) => {
      req.reply({ ...attempt, serverNow: new Date().toISOString() });
    }).as("resumeAttempt");
    cy.then(() => events.get("foreground")!());
    cy.wait("@resumeAttempt");
    cy.contains("해당 환자에게 가장 적절한 치료약물은?").should("be.visible");
  });

  it("저장 전 메모는 이탈 경고를 표시하고 백그라운드 전환 시 저장", () => {
    openPractice("CBT");
    cy.contains("article button", "메모").scrollIntoView().click();
    cy.clock(Date.now(), ["setTimeout", "clearTimeout"]);
    cy.get("textarea").type("복귀 후 확인할 메모", { delay: 0 });
    cy.window().then((win) => {
      const warning = new win.Event("beforeunload", { cancelable: true });
      win.dispatchEvent(warning);
      expect(warning.defaultPrevented).to.equal(true);
      events.get("background")!();
    });
    cy.wait("@saveAnswer")
      .its("request.body.updates.0.memo")
      .should("equal", "복귀 후 확인할 메모");
    cy.get("textarea").should("not.be.disabled");
    cy.window().then((win) => {
      const warning = new win.Event("beforeunload", { cancelable: true });
      win.dispatchEvent(warning);
      expect(warning.defaultPrevented).to.equal(false);
    });
  });

  it("저장 결과가 불확실할 때 복귀가 요청을 덮어쓰지 않고 동일 키로 재시도", () => {
    openPractice("HANDCRAFTED");
    let failedBody: unknown;
    cy.intercept(
      "PUT",
      "**/api/learning/attempts/layout-attempt/answers",
      (req) => {
        failedBody = req.body;
        req.reply({ statusCode: 503, body: { message: "offline" } });
      },
    ).as("failedSave");
    cy.contains("button", "프로프라놀롤").scrollIntoView().click();
    cy.wait("@failedSave");
    cy.contains("같은 요청 다시 시도").should("be.visible");
    cy.then(() => events.get("foreground")!());
    cy.contains("같은 요청 다시 시도").should("be.visible");
    cy.intercept(
      "PUT",
      "**/api/learning/attempts/layout-attempt/answers",
      (req) => {
        expect(req.body).to.deep.equal(failedBody);
        req.reply({ statusCode: 503, body: { message: "offline" } });
      },
    ).as("retrySave");
    cy.contains("button", "같은 요청 다시 시도").click();
    cy.wait("@retrySave");
  });

  it("핀치 확대 중에는 가시 영역 변화로 레이아웃을 다시 배치하지 않음", () => {
    cy.visit("/login");
    cy.get("html").should(($html) =>
      expect($html[0].style.getPropertyValue("--app-viewport-height")).to.equal(
        "844px",
      ),
    );
    cy.window().then((win) => {
      viewport.scale = 2;
      viewport.height = 422;
      viewport.dispatchEvent(new win.Event("resize"));
    });
    cy.get("html").should(($html) =>
      expect($html[0].style.getPropertyValue("--app-viewport-height")).to.equal(
        "844px",
      ),
    );
  });
});
