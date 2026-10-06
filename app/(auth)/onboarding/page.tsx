"use client";

import { LoadingIndicator } from "@/components/atoms/LoadingIndicator";
import { Toast } from "@/components/atoms/Toast";
import { AppShell } from "@/components/molecules/AppShell";
import { CustomHeader } from "@/components/molecules/CustomHeader";
import { isSignupGrade, isSignupSource } from "@/constants/signup";
import { fetchAPI } from "@/lib/client/fetch";
import { updateProfileAtom } from "@/store/profile";
import type {
  PersonalInfoResponse,
  PersonalInfoValues,
} from "@/types/personalInfo";
import { useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { PersonalInfoForm } from "./_components/PersonalInfoForm";

const endpoint = "/api/profile/personal-info";

function formValues(profile: PersonalInfoResponse): PersonalInfoValues {
  return {
    realName: profile.realName ?? "",
    nickname: profile.nickname ?? "",
    grade: isSignupGrade(profile.grade) ? profile.grade : "",
    university: profile.university ?? "",
    signupSource: isSignupSource(profile.signupSource)
      ? profile.signupSource
      : "",
  };
}

export default function PersonalInfoSettingsPage() {
  const [values, setValues] = useState<PersonalInfoValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reload, setReload] = useState(0);
  const saveLock = useRef(false);
  const updateProfile = useSetAtom(updateProfileAtom);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const profile = (await fetchAPI(
          endpoint,
          "GET",
        )) as PersonalInfoResponse;
        if (active) setValues(formValues(profile));
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "맞춤형 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [reload]);

  const handleSave = async () => {
    if (!values || saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    const requested = {
      ...values,
      realName: values.realName.trim(),
      nickname: values.nickname.trim(),
      university: values.university.trim(),
    };
    try {
      const profile = (await fetchAPI(
        endpoint,
        "PUT",
        requested,
      )) as PersonalInfoResponse;
      const updated = formValues(profile);
      if (
        Object.keys(requested).some(
          (key) =>
            requested[key as keyof PersonalInfoValues] !==
            updated[key as keyof PersonalInfoValues],
        )
      ) {
        throw new Error(
          "변경한 정보를 확인하지 못했습니다. 다시 시도해주세요.",
        );
      }
      setValues(updated);
      updateProfile({
        nickname: updated.nickname,
        school: updated.university,
        studentGrade: updated.grade,
      });
      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "변경 사항을 저장하지 못했습니다.",
      );
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  };

  return (
    <AppShell bottomNav={false} bottomSpacing="none">
      <CustomHeader title="맞춤형 정보 설정" />
      {loading ? (
        <LoadingIndicator
          label="맞춤형 정보를 불러오는 중..."
          className="min-h-64"
        />
      ) : loadError ? (
        <div className="px-6 py-12 text-center">
          <p role="alert" className="text-body-medium text-muted-foreground">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => setReload((current) => current + 1)}
            className="mt-4 text-title-small text-primary underline underline-offset-4"
          >
            다시 불러오기
          </button>
        </div>
      ) : values ? (
        <div className="px-6 pt-6">
          <PersonalInfoForm
            values={values}
            onChange={(next) => {
              setValues(next);
              setSaveError(null);
            }}
            onSave={() => void handleSave()}
            saving={saving}
            error={saveError}
          />
        </div>
      ) : null}
      <Toast
        open={saved}
        onClose={() => setSaved(false)}
        message="맞춤형 정보가 변경되었습니다."
        duration={2500}
      />
    </AppShell>
  );
}
