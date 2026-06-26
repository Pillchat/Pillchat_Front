import { NextResponse } from "next/server";

const DOC_URL = "https://infuser.odcloud.kr/oas/docs?namespace=15061941/v1";
const API_BASE_URL = "https://api.odcloud.kr/api";
const CACHE_SECONDS = 60 * 60 * 24;
const FALLBACK_PATH = "/15061941/v1/uddi:e98378a4-9c24-417e-9805-c81133dc3678";

const FIELD_YEAR = "\uC5F0\uB3C4";
const FIELD_PROFESSION = "\uC9C1\uC885";
const FIELD_ROUND = "\uD68C\uCC28";
const FIELD_EXAM_NAME = "\uC2DC\uD5D8\uBA85";
const FIELD_EXAM_DATE = "\uC2DC\uD5D8\uC77C";
const PHARMACIST = "\uC57D\uC0AC";
const EXAM_SCHEDULE_SUMMARY = "\uC2DC\uD5D8\uC77C\uC815 \uC815\uBCF4";
const KHP_SOURCE =
  "\uD55C\uAD6D\uBCF4\uAC74\uC758\uB8CC\uC778\uAD6D\uAC00\uC2DC\uD5D8\uC6D0_\uC2DC\uD5D8\uC815\uBCF4";

type ExamRow = Record<string, unknown>;

const getServiceKey = () =>
  process.env.ODCLOUD_SERVICE_KEY ??
  process.env.ODCLOUD_KHP_EXAM_SERVICE_KEY ??
  process.env.DATA_GO_KR_SERVICE_KEY ??
  "";

const getFallbackPath = () =>
  process.env.ODCLOUD_KHP_EXAM_PATH ??
  process.env.ODCLOUD_KHP_EXAM_FALLBACK_PATH ??
  FALLBACK_PATH;

const getStringField = (row: ExamRow, field: string) => {
  const value = row[field];
  return typeof value === "string" ? value : value == null ? "" : String(value);
};

const getNumberField = (row: ExamRow, field: string) => {
  const value = row[field];
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extractPublishedAt = (summary = "") => {
  const match = summary.match(/_(\d{8})$/);
  return match ? Number(match[1]) : 0;
};

const resolveLatestPath = async () => {
  try {
    const response = await fetch(DOC_URL, {
      next: { revalidate: CACHE_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`OpenAPI document request failed (${response.status})`);
    }

    const doc = await response.json();
    const paths = Object.entries<any>(doc.paths ?? {});

    const latest = paths
      .map(([path, value]) => {
        const summary = value?.get?.summary ?? "";

        return {
          path,
          summary,
          publishedAt: extractPublishedAt(summary),
        };
      })
      .filter((item) => item.summary.includes(EXAM_SCHEDULE_SUMMARY))
      .sort((a, b) => b.publishedAt - a.publishedAt)[0];

    return latest ?? { path: getFallbackPath(), summary: "fallback" };
  } catch (error) {
    console.error("Failed to resolve KHP exam UDDI:", error);
    return { path: getFallbackPath(), summary: "fallback" };
  }
};

const encodeServiceKey = (serviceKey: string) =>
  serviceKey.includes("%") ? serviceKey : encodeURIComponent(serviceKey);

const parseExamDate = (rawDate?: string, fallbackYear?: number | null) => {
  if (!rawDate) return null;

  const compact = rawDate.replace(/\s/g, "");
  const fullDate = compact.match(/(20\d{2})[.\-/년](\d{1,2})[.\-/월](\d{1,2})/);

  if (fullDate) {
    const [, year, month, day] = fullDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const shortDate = compact.match(/(\d{1,2})[.\-/월](\d{1,2})/);
  if (shortDate && fallbackYear) {
    const [, month, day] = shortDate;
    return `${fallbackYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
};

const getSeoulTodayUtc = () => {
  const now = new Date();
  const seoulNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );

  return Date.UTC(
    seoulNow.getFullYear(),
    seoulNow.getMonth(),
    seoulNow.getDate(),
  );
};

const calculateDday = (dateValue: string) => {
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return null;

  const target = Date.UTC(year, month - 1, day);
  return Math.ceil((target - getSeoulTodayUtc()) / 86_400_000);
};

const isPharmacistExam = (row: ExamRow) => {
  const profession = getStringField(row, FIELD_PROFESSION);
  const examName = getStringField(row, FIELD_EXAM_NAME);
  return profession.includes(PHARMACIST) || examName.includes(PHARMACIST);
};

export async function GET() {
  const serviceKey = getServiceKey();

  if (!serviceKey) {
    return NextResponse.json(
      {
        message:
          "ODCLOUD_SERVICE_KEY, ODCLOUD_KHP_EXAM_SERVICE_KEY, or DATA_GO_KR_SERVICE_KEY is required.",
      },
      { status: 503 },
    );
  }

  try {
    const latestPath = await resolveLatestPath();
    const query = new URLSearchParams({
      page: "1",
      perPage: "1000",
      returnType: "JSON",
    });
    const url = `${API_BASE_URL}${latestPath.path}?${query.toString()}&serviceKey=${encodeServiceKey(serviceKey)}`;

    const response = await fetch(url, {
      next: { revalidate: CACHE_SECONDS },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          exam: null,
          message: "KHP exam schedule API request failed.",
          status: response.status,
          payload,
        },
        {
          headers: {
            "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 7}`,
          },
        },
      );
    }

    const rows = Array.isArray(payload?.data)
      ? (payload.data as ExamRow[])
      : [];
    const exams = rows
      .filter(isPharmacistExam)
      .map((row) => {
        const year = getNumberField(row, FIELD_YEAR);
        const date = parseExamDate(getStringField(row, FIELD_EXAM_DATE), year);
        return {
          row,
          year,
          date,
          dDay: date ? calculateDday(date) : null,
        };
      })
      .filter((item) => item.date);

    const futureExam = exams
      .filter((item) => (item.dDay ?? -1) >= 0)
      .sort((a, b) => (a.dDay ?? 0) - (b.dDay ?? 0))[0];

    if (!futureExam) {
      return NextResponse.json(
        {
          exam: null,
          message: "No future pharmacist national exam schedule was found.",
          fields: {
            year: FIELD_YEAR,
            profession: FIELD_PROFESSION,
            round: FIELD_ROUND,
            examName: FIELD_EXAM_NAME,
            examDate: FIELD_EXAM_DATE,
          },
        },
        {
          headers: {
            "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 7}`,
          },
        },
      );
    }

    const row = futureExam.row;
    const body = {
      source: KHP_SOURCE,
      sourcePath: latestPath.path,
      sourceSummary: latestPath.summary,
      cachedForSeconds: CACHE_SECONDS,
      fetchedAt: new Date().toISOString(),
      exam: {
        id: "guksi",
        label: "\uC57D\uC0AC \uAD6D\uC2DC",
        date: futureExam.date,
        dDay: futureExam.dDay,
        rawDate: getStringField(row, FIELD_EXAM_DATE),
        year: futureExam.year,
        round: getNumberField(row, FIELD_ROUND),
        profession: getStringField(row, FIELD_PROFESSION),
        examName: getStringField(row, FIELD_EXAM_NAME),
      },
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 7}`,
      },
    });
  } catch (error) {
    console.error("Failed to fetch pharmacist national exam D-Day:", error);
    return NextResponse.json(
      { message: "Failed to fetch pharmacist national exam D-Day." },
      { status: 500 },
    );
  }
}
