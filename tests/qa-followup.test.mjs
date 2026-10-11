import assert from "node:assert/strict";
import test from "node:test";
import { loader, storage } from "./helpers/load-ts.mjs";

const library = {
  folders: [{ id: "folder-1", name: "시험 대비" }],
  materialFolderIds: { 10: "folder-1" },
};
const metadata = loader()("lib/client/materialMetadata.ts");
test("personal archive uses the actual profile and category instead of legacy subject", () => {
  const result = metadata.getMaterialMetadata(
    { id: 10, userId: "9007199254740993", subjectName: "생화학" },
    { nickname: "약학생" },
    library,
    "9007199254740993",
  );
  assert.equal(result.authorName, "약학생");
  assert.equal(result.subjectName, "생화학");
  assert.equal(result.categoryName, "시험 대비");
  assert.equal(result.isAuthor, true);
  assert.equal(
    metadata.getMaterialMetadata(
      { id: 11, userId: "9007199254740993", subjectName: "생화학" },
      undefined,
      library,
      "9007199254740993",
    ).categoryName,
    "",
  );
});
test("another author's material never borrows the viewer's archive category", () => {
  const result = metadata.getMaterialMetadata(
    { id: 10, userId: "9007199254740992", subjectName: "약물학" },
    { nickname: "작성자" },
    library,
    "9007199254740993",
  );
  assert.equal(result.isAuthor, false);
  assert.equal(result.categoryName, "약물학");
  assert.equal(result.authorName, "작성자");
});
test("personal uploads persist selected subject and file references", () => {
  const body = metadata.archiveMaterialPayload(
    " 노트 ",
    " 설명 ",
    ["material/abc.png"],
    "material/note.pdf",
    17,
  );
  assert.equal(body.privateArchive, true);
  assert.equal(body.subjectId, 17);
  assert.equal(body.urlKey[0], "material/abc.png");
  assert.equal(body.pdfKey, "material/note.pdf");
});
test("tutorial completion survives reload and is scoped to both account and feature", () => {
  const localStorage = storage();
  const make = () =>
    loader({ window: { localStorage, dispatchEvent() {} } })(
      "lib/client/tutorial.ts",
    );
  const first = make();
  assert.equal(first.hasCompletedTutorial("flashcards", "alice"), false);
  // Opening or leaving a tutorial without completion does not write a marker.
  assert.equal(make().hasCompletedTutorial("flashcards", "alice"), false);
  first.completeTutorial("flashcards", "alice");
  const reload = make();
  assert.equal(reload.hasCompletedTutorial("flashcards", "alice"), true);
  assert.equal(reload.hasCompletedTutorial("cbt", "alice"), false);
  assert.equal(reload.hasCompletedTutorial("flashcards", "bob"), false);
  assert.equal(reload.hasCompletedTutorial("flashcards", null), false);
});
test("storage failure still allows a completed tutorial to finish for this session", () => {
  const api = loader({
    window: {
      localStorage: {
        getItem() {
          throw new Error("blocked");
        },
        setItem() {
          throw new Error("blocked");
        },
      },
      dispatchEvent() {},
    },
  })("lib/client/tutorial.ts");
  assert.equal(api.hasCompletedTutorial("cbt", "alice"), false);
  api.completeTutorial("cbt", "alice");
  assert.equal(api.hasCompletedTutorial("cbt", "alice"), true);
});
test("flashcard errors do not expose backend enum names or exception details", () => {
  const { flashcardErrorMessage } = loader()("lib/flashcards/messages.ts");
  assert.equal(
    flashcardErrorMessage({ status: 401, message: "GRADE.NONE" }),
    "로그인이 만료됐어요. 다시 로그인해 주세요.",
  );
  assert.doesNotMatch(
    flashcardErrorMessage(new Error("java.lang.GRADE.INVALID")),
    /GRADE|java|INVALID/,
  );
});
