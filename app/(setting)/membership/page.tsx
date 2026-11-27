"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { SolidButton } from "@/components/atoms/SolidButton";
import { CustomHeader } from "@/components/molecules/CustomHeader";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { getCurrentUserId } from "@/lib/client/auth";
import { readMembership } from "@/lib/client/membership";
import { initializeNativeApp, nachocodeSandbox } from "@/lib/client/nativeApp";
import { cn } from "@/lib/utils";

const passes = [
  { days: 15, price: 2_900, name: "필챗 패스 15일 이용권" },
  { days: 30, price: 3_900, name: "필챗 패스 30일 이용권" },
];

const won = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

export default function MembershipPage() {
  const userId = useAuthIdentity();
  return <MembershipCheckout key={userId} userId={userId} />;
}

function MembershipCheckout({ userId }: { userId: string | null }) {
  const [selectedPass, setSelectedPass] = useState<(typeof passes)[number]>();
  const [notice, setNotice] = useState("");
  const [buying, setBuying] = useState(false);
  const pendingKey = userId ? `pillchat:pending-iap:v1:${userId}` : null;
  const [pendingPurchase, setPendingPurchase] = useState(() => {
    if (!pendingKey || typeof window === "undefined") return undefined;
    try {
      const stored = Number(window.localStorage.getItem(pendingKey));
      return stored > 0 && Number.isSafeInteger(stored) ? stored : undefined;
    } catch {
      return undefined;
    }
  });
  const busy = useRef(false);
  const membership = useQuery({
    queryKey: ["my-membership", userId],
    queryFn: () => readMembership(),
    enabled: Boolean(userId),
    retry: false,
  });
  const currentPass = membership.data;
  const expiresOn = currentPass?.endDate?.slice(0, 10).replaceAll("-", ".");

  async function confirmPurchase(purchaseId: number) {
    try {
      const result = await readMembership(purchaseId);
      if (result.purchaseUserId !== userId || getCurrentUserId() !== userId)
        return;
      if (
        result.purchaseStatus === "CONFIRMED" ||
        result.purchaseStatus === "REFUNDED"
      ) {
        setPendingPurchase(undefined);
        try {
          if (pendingKey) window.localStorage.removeItem(pendingKey);
        } catch {
          // The pass is already confirmed on the server.
        }
        setNotice(
          result.purchaseStatus === "REFUNDED"
            ? "이 구매는 환불됐어요."
            : "구매가 완료됐어요.",
        );
        await membership.refetch();
        return;
      }
    } catch {
      // The charge may have succeeded even when the entitlement request fails.
    }
    setNotice("구매를 확인 중이에요. 다시 결제하지 말고 상태를 확인해주세요.");
  }

  async function purchase() {
    if (
      !selectedPass ||
      !userId ||
      busy.current ||
      pendingPurchase !== undefined
    )
      return;
    busy.current = true;
    setBuying(true);
    setNotice("");
    try {
      const sdk = await initializeNativeApp();
      if (!sdk) {
        setNotice("이용권은 필챗 앱에서 구매할 수 있어요.");
        return;
      }
      if (!sdk.iap) {
        setNotice("인앱결제를 사용하려면 필챗 앱을 업데이트해주세요.");
        return;
      }
      const account = await readMembership();
      const productKey = account.storeProducts?.[selectedPass.days];
      if (account.purchaseUserId !== userId || getCurrentUserId() !== userId) {
        setNotice("로그인 상태를 확인하고 다시 시도해주세요.");
        return;
      }
      const environment = nachocodeSandbox ? "sandbox" : "production";
      if (!productKey || account.purchaseEnvironment !== environment) {
        setNotice("현재 이용권을 구매할 수 없어요. 잠시 후 다시 시도해주세요.");
        return;
      }
      const { iap } = sdk;
      const result = await new Promise<NachocodePurchaseResult>(
        (resolve, reject) => {
          void iap.purchase(productKey, userId, resolve).catch(reject);
        },
      );
      if (getCurrentUserId() !== userId) return;
      if (!result.status.success) {
        const code = result.status.error?.code;
        setNotice(
          code === "ERR-NNA-ILA-22" || code === "ERR-NNI-ILA-22"
            ? "결제가 취소됐어요."
            : "결제를 완료하지 못했어요. 스토어 구매 내역을 확인해주세요.",
        );
        return;
      }
      if (
        !result.purchaseId ||
        result.purchaseId < 0 ||
        !Number.isSafeInteger(result.purchaseId)
      ) {
        void membership.refetch();
        setNotice(
          "스토어 구매가 완료됐어요. 이용권이 보이지 않으면 구매 내역을 확인해주세요.",
        );
        return;
      }
      setPendingPurchase(result.purchaseId);
      try {
        if (pendingKey)
          window.localStorage.setItem(pendingKey, String(result.purchaseId));
      } catch {
        // Keep the purchase pending for the current page if storage is blocked.
      }
      await confirmPurchase(result.purchaseId);
    } catch {
      setNotice(
        "결제 상태를 확인하지 못했어요. 스토어 구매 내역을 먼저 확인해주세요.",
      );
    } finally {
      busy.current = false;
      setBuying(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-white">
      <CustomHeader title="멤버십 관리" />

      <main className="mx-auto w-full max-w-[35rem] flex-1 px-6 pb-8 pt-4">
        <fieldset disabled={buying} className="min-w-0 space-y-3">
          <legend className="sr-only">이용권 선택</legend>
          {passes.map((pass) => {
            const isSelected = selectedPass === pass;

            return (
              <label
                key={pass.days}
                className={cn(
                  "flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                  isSelected
                    ? "border-primary bg-primary-980"
                    : "border-gray-200",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-title-large">{pass.name}</span>
                  <span className="mt-1 block text-body-medium text-muted-foreground">
                    {pass.days}일 · {won.format(pass.price)}
                  </span>
                </span>
                <input
                  type="radio"
                  name="membership-pass"
                  value={pass.days}
                  checked={isSelected}
                  onChange={() => {
                    setSelectedPass(pass);
                    if (pendingPurchase === undefined) setNotice("");
                  }}
                  className="size-5 shrink-0 accent-primary focus:outline-none"
                />
              </label>
            );
          })}
        </fieldset>
        <p className="mt-4 text-body-medium text-muted-foreground">
          1회 결제 · 자동 갱신 없음
        </p>
        {(notice || pendingPurchase !== undefined) && (
          <p role="status" className="mt-3 text-body-medium">
            {notice ||
              "구매를 확인 중이에요. 다시 결제하지 말고 상태를 확인해주세요."}
          </p>
        )}
        {pendingPurchase !== undefined && !buying && (
          <button
            type="button"
            className="mt-2 text-body-medium underline underline-offset-2"
            onClick={() => void confirmPurchase(pendingPurchase)}
          >
            구매 상태 다시 확인
          </button>
        )}
        {!!currentPass?.passDays && expiresOn && (
          <div className="mt-6 space-y-1 border-t border-gray-100 pt-4">
            <p className="text-title-large">{currentPass.planName} 이용 중</p>
            <p className="text-body-medium text-muted-foreground">
              {expiresOn}까지 이용 가능
            </p>
            <Link
              className="inline-block py-2 text-body-medium underline underline-offset-2"
              href="/questionbank/handcrafted"
            >
              전문검수문제 풀기
            </Link>
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-gray-100 bg-white px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto max-w-[32rem] space-y-3">
          <div className="flex items-center justify-between gap-3 text-title-large">
            <span>결제 금액</span>
            <output aria-label="결제 금액" className="tabular-nums">
              {selectedPass ? won.format(selectedPass.price) : "—"}
            </output>
          </div>
          <SolidButton
            type="button"
            content="구매하기"
            loading={buying}
            disabled={!selectedPass || !userId || pendingPurchase !== undefined}
            onClick={() => void purchase()}
          />
        </div>
      </footer>
    </div>
  );
}
