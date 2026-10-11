import { serverFetch } from "@/lib/server/fetch";
import { AdminPushNotificationType } from "@/types/notification";
import { NextRequest } from "next/server";

type AdminPushJobRequest = {
  audience: "USERS" | "ALL";
  idempotencyKey: string;
  notificationType?: AdminPushNotificationType;
  title: string;
  content: string;
  linkURL?: string;
  imageURL?: string;
  scheduleTime?: string;
  userIds?: Array<number | string>;
};

export const normalizeUserIds = (userIds: unknown) => {
  if (!Array.isArray(userIds)) return [];

  return userIds
    .map((id) => Number(String(id).trim()))
    .filter((id) => Number.isSafeInteger(id) && id > 0);
};

export const enqueueAdminPushJob = (
  request: NextRequest,
  body: AdminPushJobRequest,
) => {
  const targetUserIds = normalizeUserIds(body.userIds);
  const dataPayload = body.imageURL ? { imageURL: body.imageURL } : undefined;

  return serverFetch("/api/admin/push-jobs", {
    method: "POST",
    request,
    data: {
      jobType: body.notificationType ?? "SYSTEM",
      audience: body.audience,
      idempotencyKey: body.idempotencyKey,
      title: body.title,
      body: body.content,
      deepLink: body.linkURL || undefined,
      dataPayload,
      scheduledAt: body.scheduleTime || undefined,
      ...(body.audience === "USERS" ? { targetUserIds } : {}),
    },
  });
};
