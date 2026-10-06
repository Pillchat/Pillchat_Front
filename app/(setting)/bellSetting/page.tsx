"use client";

import { FC, useMemo, useState } from "react";
import { Toggle } from "@/components/atoms";
import { CustomHeader, SectionWithChips } from "@/components/molecules";
import { useQueryClient } from "@tanstack/react-query";
import {
  notificationSettingsQueryKey,
  subjectFollowsQueryKey,
  SubjectFollow,
  useNotificationSettingsQuery,
  useSubjectFollowsQuery,
} from "@/hooks/queries";
import {
  useSetSubjectFollowMutation,
  useUpdateNotificationSettingsMutation,
} from "@/hooks/mutations";
import {
  DEFAULT_NOTIFICATION_SETTING,
  NotificationSetting,
} from "@/types/notification";
import { useSubjects } from "@/hooks";
import { fetchAPI } from "@/lib/client/fetch";

type SettingRowProps = {
  title: string;
  description?: string;
  checked: boolean;
  disabled: boolean;
  ariaLabel: string;
  onChange: (next: boolean) => void;
};

const SettingRow: FC<SettingRowProps> = ({
  title,
  description,
  checked,
  disabled,
  ariaLabel,
  onChange,
}) => (
  <div className="flex w-full flex-row items-center justify-between gap-4 py-1">
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="break-keep text-base">{title}</p>
      {description && (
        <p className="mt-1 break-keep text-xs text-button-foreground">
          {description}
        </p>
      )}
    </div>
    <Toggle
      checked={checked}
      onChange={onChange}
      ariaLabel={ariaLabel}
      disabled={disabled}
      size="md"
    />
  </div>
);

const toNumericSubjectId = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const extractSubjectId = (source: unknown) => {
  const target =
    source && typeof source === "object" && "data" in source
      ? (source as { data?: unknown }).data
      : source;

  if (!target || typeof target !== "object") return null;

  const record = target as Record<string, unknown>;
  const candidates = [
    record.id,
    record.subjectId,
    record.subject_id,
    record.value,
  ];

  for (const candidate of candidates) {
    const subjectId = toNumericSubjectId(candidate);
    if (subjectId) return subjectId;
  }

  return null;
};

const extractSubjectFollowLabel = (follow: SubjectFollow) => {
  const record = follow as Record<string, any>;
  const value =
    record.subjectName ??
    record.name ??
    record.label ??
    record.subjectLabel ??
    record.subject?.name ??
    record.subject?.label;

  return typeof value === "string" && value.length > 0 ? value : null;
};

const BellSetting: FC = () => {
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [subjectFollowMessage, setSubjectFollowMessage] = useState<
    string | null
  >(null);
  const [isResolvingSubject, setIsResolvingSubject] = useState(false);

  const {
    getSubjectByLabel,
    getSubjectCodeByLabel,
    getSubjectMapForChips,
    isLoading: isSubjectsLoading,
  } = useSubjects();

  const { data, isLoading, isError, error } = useNotificationSettingsQuery();
  const settings = data ?? DEFAULT_NOTIFICATION_SETTING;
  const {
    data: subjectFollows = [],
    isLoading: isSubjectFollowsLoading,
    isError: isSubjectFollowsError,
    error: subjectFollowsError,
  } = useSubjectFollowsQuery();

  const mutation = useUpdateNotificationSettingsMutation<{
    previous?: NotificationSetting;
  }>({
    onMutate: async (patch) => {
      setStatusMessage(null);
      await queryClient.cancelQueries({
        queryKey: notificationSettingsQueryKey,
      });

      const previous = queryClient.getQueryData<NotificationSetting>(
        notificationSettingsQueryKey,
      );

      queryClient.setQueryData<NotificationSetting>(
        notificationSettingsQueryKey,
        {
          ...DEFAULT_NOTIFICATION_SETTING,
          ...previous,
          ...patch,
        },
      );

      return { previous };
    },
    onError: (mutationError, _patch, context) => {
      queryClient.setQueryData(
        notificationSettingsQueryKey,
        context?.previous ?? DEFAULT_NOTIFICATION_SETTING,
      );

      setStatusMessage(
        mutationError.message || "알림 설정을 저장하지 못했습니다.",
      );
    },
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(notificationSettingsQueryKey, updatedSettings);
      setStatusMessage("알림 설정이 저장되었습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: notificationSettingsQueryKey,
      });
    },
  });

  const disabled = isLoading || isError || !data || mutation.isPending;

  const subjectFollowMutation = useSetSubjectFollowMutation<{
    previous?: SubjectFollow[];
  }>({
    onMutate: async ({ subjectId, subjectLabel, followed }) => {
      setSubjectFollowMessage(null);
      await queryClient.cancelQueries({
        queryKey: subjectFollowsQueryKey,
      });

      const previous =
        queryClient.getQueryData<SubjectFollow[]>(subjectFollowsQueryKey) ?? [];

      if (subjectLabel) {
        queryClient.setQueryData<SubjectFollow[]>(
          subjectFollowsQueryKey,
          followed
            ? [
                ...previous.filter(
                  (follow) => String(follow.subjectId) !== String(subjectId),
                ),
                { subjectId: Number(subjectId), subjectName: subjectLabel },
              ]
            : previous.filter((follow) => {
                const label = extractSubjectFollowLabel(follow);
                return (
                  String(follow.subjectId) !== String(subjectId) &&
                  label !== subjectLabel
                );
              }),
        );
      }

      return { previous };
    },
    onError: (mutationError, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(subjectFollowsQueryKey, context.previous);
      }

      setSubjectFollowMessage(
        mutationError.message || "관심 과목 설정을 저장하지 못했습니다.",
      );
    },
    onSuccess: () => {
      setSubjectFollowMessage("관심 과목 설정이 저장되었습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: subjectFollowsQueryKey,
      });
    },
  });

  const primaryRows = useMemo(
    () =>
      [
        {
          field: "notificationEnabled",
          title: "전체 알림",
          description: "답변, 채택, 관심 과목, 혜택 알림 전체 수신 여부",
          ariaLabel: "전체 알림 토글",
        },
        {
          field: "followNotificationEnabled",
          title: "새 팔로워",
          ariaLabel: "팔로우 알림 토글",
        },
        {
          field: "answerNotificationEnabled",
          title: "나의 질문에 대한 답변",
          ariaLabel: "답변 알림 토글",
        },
        {
          field: "adoptNotificationEnabled",
          title: "나의 답변 채택",
          ariaLabel: "채택 알림 토글",
        },
        {
          field: "subjectQuestionEnabled",
          title: "관심있는 과목의 질문 등록",
          ariaLabel: "질문 등록 알림 토글",
        },
        {
          field: "subjectMaterialEnabled",
          title: "관심있는 과목의 학습자료 등록",
          ariaLabel: "학습자료 등록 알림 토글",
        },
      ] satisfies Array<{
        field: keyof NotificationSetting;
        title: string;
        description?: string;
        ariaLabel: string;
      }>,
    [],
  );

  const marketingRows = useMemo(
    () =>
      [
        {
          field: "benefitNotificationEnabled",
          title: "혜택성 푸시 알림",
          description: "쿠폰정보, 이벤트, 특가상품 등 알림 설정",
          ariaLabel: "혜택성 푸시 알림 토글",
        },
        {
          field: "nightNotificationEnabled",
          title: "야간 정보 수신 동의",
          description: "22:00 ~ 08:00에도 알림을 수신",
          ariaLabel: "야간 정보 수신 토글",
        },
      ] satisfies Array<{
        field: keyof NotificationSetting;
        title: string;
        description?: string;
        ariaLabel: string;
      }>,
    [],
  );

  const handleChange = (field: keyof NotificationSetting) => (next: boolean) =>
    mutation.mutate({ [field]: next });

  const followedSubjectLabels = useMemo(
    () =>
      Array.from(
        new Set(
          subjectFollows
            .map((follow) => extractSubjectFollowLabel(follow))
            .filter((label): label is string => Boolean(label)),
        ),
      ),
    [subjectFollows],
  );

  const resolveSubjectId = async (subjectLabel: string) => {
    const subjectItem = getSubjectByLabel(subjectLabel);
    const embeddedSubjectId = extractSubjectId(subjectItem);
    if (embeddedSubjectId) return embeddedSubjectId;

    const subjectCode =
      subjectItem?.code ?? getSubjectCodeByLabel(subjectLabel);
    if (!subjectCode) {
      throw new Error("과목 정보를 찾을 수 없습니다.");
    }

    const response = await fetchAPI(
      `/api/subjects/${encodeURIComponent(subjectCode)}`,
      "GET",
    );
    const subjectId = extractSubjectId(response);
    if (!subjectId) {
      throw new Error("과목 ID를 찾을 수 없습니다.");
    }

    return subjectId;
  };

  const handleSubjectFollowToggle = async (subjectLabel: string) => {
    if (
      isSubjectsLoading ||
      isSubjectFollowsLoading ||
      isResolvingSubject ||
      subjectFollowMutation.isPending
    ) {
      return;
    }

    setIsResolvingSubject(true);
    setSubjectFollowMessage(null);

    try {
      const subjectId = await resolveSubjectId(subjectLabel);
      subjectFollowMutation.mutate({
        subjectId,
        subjectLabel,
        followed: !followedSubjectLabels.includes(subjectLabel),
      });
    } catch (resolveError: any) {
      setSubjectFollowMessage(
        resolveError?.message || "관심 과목 설정을 저장하지 못했습니다.",
      );
    } finally {
      setIsResolvingSubject(false);
    }
  };

  const subjectFollowStatusMessage =
    isSubjectsLoading || isSubjectFollowsLoading
      ? "관심 과목 정보를 불러오는 중입니다."
      : isSubjectFollowsError
        ? subjectFollowsError?.message ||
          "관심 과목 정보를 불러오지 못했습니다."
        : subjectFollowMessage;

  return (
    <div className="flex min-h-dvh flex-col items-center">
      <CustomHeader title="알림 설정" />

      <div className="mt-3 flex w-[90%] flex-col gap-7">
        {primaryRows.map((row) => (
          <SettingRow
            key={row.field}
            title={row.title}
            description={row.description}
            checked={settings[row.field]}
            disabled={disabled}
            ariaLabel={row.ariaLabel}
            onChange={handleChange(row.field)}
          />
        ))}
      </div>

      <div id="line" className="mt-8 h-[1px] w-[90%] bg-muted" />

      <div className="mt-8 flex w-[90%] flex-col gap-7">
        {marketingRows.map((row) => (
          <SettingRow
            key={row.field}
            title={row.title}
            description={row.description}
            checked={settings[row.field]}
            disabled={disabled}
            ariaLabel={row.ariaLabel}
            onChange={handleChange(row.field)}
          />
        ))}
      </div>

      <div id="subject-line" className="mt-8 h-[1px] w-[90%] bg-muted" />

      <div className="mt-8 flex w-[90%] flex-col gap-4">
        <div className="flex flex-col">
          <p className="break-keep text-base">관심 과목 알림</p>
          <p className="mt-1 break-keep text-xs text-button-foreground">
            선택한 과목의 새 질문과 학습자료 알림
          </p>
        </div>

        <SectionWithChips
          data={{
            과목: Object.values(getSubjectMapForChips()).flat(),
          }}
          selectedItems={followedSubjectLabels}
          onItemToggle={handleSubjectFollowToggle}
          chipContainerClassName="flex gap-1"
          selectedChipClassName="border-primary bg-accent text-primary"
          showDropdown
          maxVisibleChips={6}
          expandedData={getSubjectMapForChips()}
          showDropdownButton
        />
      </div>

      {subjectFollowStatusMessage && (
        <p
          className={`mt-4 w-[90%] text-sm ${
            isSubjectFollowsError ||
            subjectFollowStatusMessage.includes("못했습니다") ||
            subjectFollowStatusMessage.includes("찾을 수 없습니다")
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {subjectFollowStatusMessage}
        </p>
      )}

      {(isLoading || isError || statusMessage) && (
        <p
          className={`mt-6 w-[90%] text-sm ${
            isError || statusMessage?.includes("못했습니다")
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {isLoading
            ? "알림 설정을 불러오는 중입니다."
            : isError
              ? error?.message || "알림 설정을 불러오지 못했습니다."
              : statusMessage}
        </p>
      )}
    </div>
  );
};

export default BellSetting;
