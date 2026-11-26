"use client";

import { useState } from "react";
import { SolidButton } from "@/components/atoms/SolidButton";
import { CustomHeader } from "@/components/molecules/CustomHeader";
import { cn } from "@/lib/utils";

const passes = [
  { days: 15, price: 2_900 },
  { days: 30, price: 3_900 },
];

const won = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

export default function MembershipPage() {
  const [selectedPass, setSelectedPass] = useState<(typeof passes)[number]>();
  const [showPurchaseNotice, setShowPurchaseNotice] = useState(false);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-white">
      <CustomHeader title="멤버십 관리" />

      <main className="mx-auto w-full max-w-[35rem] flex-1 px-6 pb-8 pt-4">
        <fieldset className="min-w-0 space-y-3">
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
                  <span className="block text-title-large">
                    전문검수문제 {pass.days}일권
                  </span>
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
                    setShowPurchaseNotice(false);
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
        {showPurchaseNotice && (
          <p role="status" className="mt-3 text-body-medium">
            이용권 구매 기능을 준비 중이에요.
          </p>
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
            disabled={!selectedPass}
            onClick={() => setShowPurchaseNotice(true)}
          />
        </div>
      </footer>
    </div>
  );
}
