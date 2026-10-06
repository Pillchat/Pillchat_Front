export type DailyQuestId = "sample" | "cbt-tutorial" | "subject-study";

export const DAILY_QUEST_UPDATED_EVENT = "pillchat:daily-quest-updated";

type DailyQuestState = {
  date: string;
  completed: DailyQuestId[];
  rewarded: boolean;
};

const getDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStorageKey = () => `pillchat:daily-quest:${getDateKey()}`;

const createEmptyState = (): DailyQuestState => ({
  date: getDateKey(),
  completed: [],
  rewarded: false,
});

export const readDailyQuestState = (): DailyQuestState => {
  if (typeof window === "undefined") return createEmptyState();

  try {
    const raw = window.localStorage.getItem(getStorageKey());
    if (!raw) return createEmptyState();

    const parsed = JSON.parse(raw) as Partial<DailyQuestState>;
    if (parsed.date !== getDateKey() || !Array.isArray(parsed.completed)) {
      return createEmptyState();
    }

    return {
      date: parsed.date,
      completed: parsed.completed.filter(
        (id): id is DailyQuestId =>
          id === "sample" || id === "cbt-tutorial" || id === "subject-study",
      ),
      rewarded: parsed.rewarded === true,
    };
  } catch {
    return createEmptyState();
  }
};

export const completeDailyQuest = (id: DailyQuestId) => {
  if (typeof window === "undefined") return;

  const current = readDailyQuestState();
  if (current.completed.includes(id)) return;

  const completed = [...current.completed, id];
  const next: DailyQuestState = {
    ...current,
    completed,
    rewarded: current.rewarded || completed.length === 3,
  };

  window.localStorage.setItem(getStorageKey(), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(DAILY_QUEST_UPDATED_EVENT));
};
