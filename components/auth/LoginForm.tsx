"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mascot } from "@/components/mascot/Mascot";
import { Icon } from "@/components/icons/Icon";
import { loginOrCreateProfile, type LoginState } from "@/actions/auth";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginOrCreateProfile, initialState);

  return (
    <div className="flex h-full flex-col justify-center px-6 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 h-20 w-20">
          <Mascot variant="color" mood="happy" />
        </div>
        <h1 className="font-bn text-xl font-bold text-text">স্বাগতম, OnboardingBuddy-তে</h1>
        <p className="mt-1 text-sm font-medium text-muted">
          আপনার এনরোল নম্বর ও পাসওয়ার্ড দিয়ে শুরু করুন
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="enrollNumber" className="mb-1.5 block font-en text-[13px] font-semibold text-text">
            Enroll Number
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
          <label htmlFor="password" className="mb-1.5 block font-en text-[13px] font-semibold text-text">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="আপনার পাসওয়ার্ড"
            className="w-full rounded-input border border-line bg-card px-4 py-3.5 font-en text-[15px] text-text outline-none placeholder:text-muted focus:border-green"
          />
          <p className="mt-1.5 text-[12px] font-medium text-muted">
            প্রথমবার লগইন করলে এই পাসওয়ার্ডটিই ভবিষ্যতের জন্য সেট হয়ে যাবে।
          </p>
        </div>

        <label className="flex items-center gap-2.5 font-en text-[13px] font-medium text-text">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="h-[18px] w-[18px] shrink-0 rounded-[5px] border border-line accent-green"
          />
          Keep me signed in
        </label>

        {state.error && (
          <div className="rounded-input bg-err-bg px-4 py-3 text-[13px] font-medium text-err-tx">{state.error}</div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-button bg-green px-4 py-4 font-en text-base font-bold text-white shadow-[0_2px_8px_rgba(44,162,77,.28)] transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          {pending ? "অপেক্ষা করুন…" : "Continue"}
          {!pending && <Icon name="arrowRight" size={18} />}
        </button>

        <Link
          href="/forgot-password"
          className="text-center font-en text-[13px] font-semibold text-green-dark"
        >
          পাসওয়ার্ড ভুলে গেছেন?
        </Link>
      </form>
    </div>
  );
}
