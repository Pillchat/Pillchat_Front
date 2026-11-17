// Local browser layout fixtures. These do not verify production authentication,
// backend persistence, mobile browser engines, or native app behavior.
export function mockScreenApis() {
  cy.intercept("**/api/**", {
    statusCode: 501,
    body: { message: "Unconfigured local screen-audit fixture" },
  });
  cy.intercept("https://developers.kakao.com/**", { body: "" });
  cy.intercept("GET", "**/api/learning/weakness/questions/*/*/confusion", {
    confused: false,
  });
  cy.intercept("GET", "**/api/learning/weakness", {
    questions: [],
    collections: [],
  });
  cy.intercept("GET", "**/api/notifications*", {
    items: [],
    unreadCount: 0,
    nextCursor: null,
    snapshotSequence: "1",
  });
  cy.intercept("GET", "**/api/notifications/**", {
    items: [],
    unreadCount: 0,
    nextCursor: null,
    snapshotSequence: "1",
  });
  cy.intercept("GET", "**/api/auth/inquiry-myprofile", {
    success: true,
    data: {
      id: "layout-user",
      nickname: "화면 점검 계정",
      school: "테스트대학교",
      studentGrade: "6학년",
    },
  });
  cy.intercept("GET", "**/api/attendance", {
    date: "2026-11-17",
    timezone: "Asia/Seoul",
    todayChecked: true,
    totalDays: 100,
    currentStreak: 7,
    longestStreak: 12,
    grade: "GOSU",
  });
  cy.intercept("GET", "**/api/users/*/follow-summary", {
    followerCount: 0,
    followingCount: 0,
  });
  cy.intercept("GET", "**/api/learning/dashboard", {
    date: "2026-11-17",
    solvedCount: 20,
    correctCount: 16,
    studySeconds: 3600,
    latestAttempt: {
      attemptId: "layout-attempt",
      source: "CBT",
      title: "약사 국가시험 대비 기기별 화면 점검용 긴 학습 제목",
      answeredCount: 3,
      questionCount: 20,
    },
    weekly: {
      weekStart: "2026-11-16",
      solvedCount: 20,
      correctCount: 16,
      days: Array.from({ length: 7 }, (_, i) => ({
        date: `2026-11-${16 + i}`,
        solvedCount: i < 2 ? 10 : 0,
        correctCount: i < 2 ? 8 : 0,
      })),
    },
  });
  cy.intercept("GET", "**/api/notices?*", {
    content: [
      {
        id: 1,
        title:
          "기기별 화면 점검을 위한 긴 공지사항 제목입니다. 작은 화면에서도 본문과 화살표가 겹치지 않아야 합니다.",
        type: "GENERAL",
        pinned: true,
        publishedAt: "2026-11-17T00:00:00Z",
      },
    ],
    last: true,
  });
  cy.intercept("GET", "**/api/exams/khp/dday", {
    fetchedAt: "2026-11-17T00:00:00Z",
    exam: { id: "guksi", label: "약사 국시", date: "2027-01-22", dDay: 66 },
  });
  const subjects = [
    "약물학",
    "약제학",
    "생화학",
    "의약품분석학",
    "물리약학",
    "약사법규",
  ];
  cy.intercept("GET", "**/api/subjects", {
    sections: [
      {
        sectionCode: "BASIC",
        sectionTitle: "전공과목",
        items: subjects.map((label, i) => ({
          code: `subject-${i}`,
          label,
          id: i + 1,
        })),
      },
    ],
  });
  cy.intercept(
    "GET",
    "**/api/questionbank/ai-questions/subjects",
    subjects.map((name, i) => ({
      subjectId: i + 1,
      name,
      categoryName: "전공과목",
    })),
  );
  cy.intercept("GET", "**/api/subjects/*", {
    id: 1,
    code: "subject-0",
    label: "약물학",
  });
  cy.intercept("GET", "**/api/questions?*", []);
}

// Wait for React's client props before a test deliberately changes DOM text.
// Changing the SSR DOM before hydration would manufacture a mismatch.
export function waitForHydration() {
  cy.get("header button")
    .first()
    .should(($button) => {
      expect(
        Object.keys($button[0]).some((key) => key.startsWith("__reactProps$")),
        "header hydrated",
      ).to.equal(true);
    });
}

export function checkHorizontalBounds() {
  cy.document().should((doc) => {
    const width = doc.documentElement.clientWidth;
    expect(doc.documentElement.scrollWidth, "document width").to.be.at.most(
      width + 1,
    );
    for (const el of doc.querySelectorAll<HTMLElement>(
      "button, input:not([type=hidden]), textarea, header, nav",
    )) {
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height || !Cypress.dom.isVisible(el)) continue;
      // Chips and carousels intentionally extend beyond their own scroll area.
      // Check the container instead; their end items are tested by scrolling.
      let scrollParent = el.parentElement;
      while (scrollParent && scrollParent !== doc.body) {
        const overflow =
          doc.defaultView!.getComputedStyle(scrollParent).overflowX;
        if (
          ["auto", "scroll"].includes(overflow) &&
          scrollParent.scrollWidth > scrollParent.clientWidth + 1
        )
          break;
        scrollParent = scrollParent.parentElement;
      }
      if (scrollParent && scrollParent !== doc.body) {
        const bounds = scrollParent.getBoundingClientRect();
        expect(bounds.left, "horizontal scroll container left").to.be.at.least(
          -1,
        );
        expect(bounds.right, "horizontal scroll container right").to.be.at.most(
          width + 1,
        );
        continue;
      }
      expect(
        box.left,
        `${el.tagName} ${el.textContent?.slice(0, 24)} left`,
      ).to.be.at.least(-1);
      expect(
        box.right,
        `${el.tagName} ${el.textContent?.slice(0, 24)} right`,
      ).to.be.at.most(width + 1);
    }
  });
}

export function checkReachable(selector: string) {
  cy.get(selector)
    .filter(":visible")
    .first()
    .scrollIntoView()
    .should(($el) => {
      const el = $el[0];
      const doc = el.ownerDocument;
      const box = el.getBoundingClientRect();
      expect(box.top, "control top").to.be.at.least(-1);
      expect(box.bottom, "control bottom").to.be.at.most(
        doc.documentElement.clientHeight + 1,
      );
      const top = doc.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      );
      expect(
        top === el || el.contains(top),
        "control not covered at center",
      ).to.equal(true);
    });
}
