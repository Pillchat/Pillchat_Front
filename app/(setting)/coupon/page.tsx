"use client";

import { PUBLIC_ASSETS } from "@/constants/assets";
import { useState } from "react";

import { CustomHeader } from "@/components/molecules";

export default function CouponPage() {
  const [couponCode, setCouponCode] = useState("");

  return (
    <div className="mx-auto min-h-dvh w-full max-w-screen-sm bg-white">
      <CustomHeader title="내 쿠폰" />

      <main className="px-6 pb-3">
        <div className="mt-5 flex gap-2">
          <div className="relative min-w-0 flex-[3]">
            <input
              type="text"
              aria-label="쿠폰번호"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="쿠폰번호를 입력해주세요."
              className="h-14 w-full rounded-xl border border-[#c4c4c4] px-3 pr-10 font-medium outline-none placeholder:text-[#999] focus:border-2 focus:border-[#111]"
            />
            {couponCode && (
              <button
                type="button"
                onClick={() => setCouponCode("")}
                className="absolute right-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center"
                aria-label="쿠폰번호 삭제"
              >
                <img
                  src={PUBLIC_ASSETS.icons.removeCircleGray}
                  alt=""
                  className="h-5 w-5"
                />
              </button>
            )}
          </div>
          <button
            type="button"
            className="h-14 flex-1 rounded-xl border border-primary text-primary"
          >
            입력
          </button>
        </div>

        <p className="mt-5 text-base font-semibold text-[#222]">총 0장 보유</p>
      </main>
    </div>
  );
}
