"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mascot } from "@/components/mascot/Mascot";
import { Icon } from "@/components/icons/Icon";
import { resetPasswordWithManagerEnroll, type ResetPasswordState } from "@/actions/password-reset";

const initialState: ResetPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPasswordWithManagerEnroll, initialState);

  if (state.success) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-4 h-20 w-20">
          <Mascot variant="color" mood="cheering" />
        </div>
        <h1 className="font-bn text-xl font-bold text-text">পাসওয়ার্ড পরিবর্তন হয়েছে</h1>
        <p className="mt-2 text-sm font-medium text-muted">এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।</p>
        <Link
          href="/login"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-button bg-green px-4 py-4 font-en text-base font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98]"
        >
          লগইনে ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center px-6 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 h-20 w-20">
          <Mascot variant="color" mood="thinking" />
        </div>
        <h1 className="font-bn text-xl font-bold text-text">পাসওয়ার্ড রিসেট করুন</h1>
        <p className="mt-1 text-sm font-medium text-muted">
          যাচাইয়ের জন্য আপনার Reporting Manager-এর Enroll Number দিন
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="enrollNumber" className="mb-1.5 block font-en text-[13px] font-semibold text-text">
            আপনার Enroll Number
          </label>
          <input
            id="enrollNumber"
            name="enrollNumber"
            type="text"
            required
            autoComplete="username"
            placeholder="যেমনঃ 560779"
            className="w-full rounded-input border border-line bg-card px-4 py-3.5 font-en text-[15px] text-text outline-none placeholder:text-muted focus:border-green"
          />
        </div>

        <div>
          <label htmlFor="managerEnrollNumber" className="mb-1.5 block font-en text-[13px] font-semibold text-text">
            Manager-এর Enroll Number
          </label>
          <input
            id="managerEnrollNumber"
            name="managerEnrollNumber"
            type="text"
            required
            autoComplete="off"
            placeholder="যেমনঃ 501234"
            className="w-full rounded-input border border-line bg-card px-4 py-3.5 font-en text-[15px] text-text outline-none placeholder:text-muted focus:border-green"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-1.5 block font-en text-[13px] font-semibold text-text">
            নতুন পাসওয়ার্ড
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="নতুন পাসওয়ার্ড"
            className="w-full rounded-input border border-line bg-card px-4 py-3.5 font-en text-[15px] text-text outline-none placeholder:text-muted focus:border-green"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block font-en text-[13px] font-semibold text-text">
            নতুন পাসওয়ার্ড নিশ্চিত করুন
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            placeholder="আবার লিখুন"
            className="w-full rounded-input border border-line bg-card px-4 py-3.5 font-en text-[15px] text-text outline-none placeholder:text-muted focus:border-green"
          />
        </div>

        {state.error && (
          <div className="rounded-input bg-err-bg px-4 py-3 text-[13px] font-medium text-err-tx">{state.error}</div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-button bg-green px-4 py-4 font-en text-base font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          {pending ? "অপেক্ষা করুন…" : "পাসওয়ার্ড রিসেট করুন"}
          {!pending && <Icon name="arrowRight" size={18} />}
        </button>

        <Link href="/login" className="text-center font-en text-[13px] font-semibold text-green-dark">
          লগইনে ফিরে যান
        </Link>
      </form>
    </div>
  );
}
