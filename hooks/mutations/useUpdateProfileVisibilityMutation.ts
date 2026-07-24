import { fetchAPI } from "@/lib/client/fetch";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

export interface UpdateProfileVisibilityRequest {
  isPublic: boolean;
}

export interface ProfileVisibilityStatus {
  isPublic: boolean;
}

const normalizeProfileVisibilityStatus = (
  response: unknown,
): ProfileVisibilityStatus => {
  const source =
    response && typeof response === "object" && "data" in response
      ? ((response as { data?: unknown }).data ?? response)
      : response;

  if (!source || typeof source !== "object") {
    throw new Error("프로필 공개 설정 응답이 올바르지 않습니다.");
  }

  const isPublic = (source as Record<string, unknown>).isPublic;
  if (typeof isPublic !== "boolean") {
    throw new Error("프로필 공개 설정 응답이 올바르지 않습니다.");
  }

  return { isPublic };
};

export const updateProfileVisibility = async (
  request: UpdateProfileVisibilityRequest,
) => {
  const response = await fetchAPI("/api/profile/visibility", "PATCH", request);
  return normalizeProfileVisibilityStatus(response);
};

export const useUpdateProfileVisibilityMutation = <TContext = unknown>(
  options?: UseMutationOptions<
    ProfileVisibilityStatus,
    Error,
    UpdateProfileVisibilityRequest,
    TContext
  >,
) => {
  return useMutation<
    ProfileVisibilityStatus,
    Error,
    UpdateProfileVisibilityRequest,
    TContext
  >({
    mutationFn: updateProfileVisibility,
    ...options,
  });
};
