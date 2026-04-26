import { NextRequest } from "next/server";

type JwtPayload = {
  sub?: string;
  userId?: string | number;
  id?: string | number;
};

const decodeBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf-8");
};

export const getRequestUserId = (request: NextRequest) => {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!token) return null;

  try {
    const payload = JSON.parse(
      decodeBase64Url(token.split(".")[1]),
    ) as JwtPayload;
    const userId = payload.userId ?? payload.id ?? payload.sub;
    return userId == null ? null : String(userId);
  } catch {
    return null;
  }
};

export const isOwnedByRequestUser = (
  item: any,
  requestUserId: string | null,
) => {
  if (!requestUserId) return false;

  const itemUserId =
    item?.userId ??
    item?.memberId ??
    item?.writerId ??
    item?.authorId ??
    item?.user?.id;

  return itemUserId != null && String(itemUserId) === requestUserId;
};
