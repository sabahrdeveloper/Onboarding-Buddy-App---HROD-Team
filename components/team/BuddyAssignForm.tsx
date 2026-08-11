"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons/Icon";
import { assignBuddy } from "@/actions/manager";

interface BuddyAssignFormProps {
  enrollNumber: string;
  initialBuddy: string;
  initialPhone: string;
  initialEmail: string;
}

export function BuddyAssignForm({ enrollNumber, initialBuddy, initialPhone, initialEmail }: BuddyAssignFormProps) {
  const [buddy, setBuddy] = useState(initialBuddy);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await assignBuddy({ enrollNumber, buddy, buddyPhone: phone, buddyEmail: email });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        value={buddy}
        onChange={(e) => setBuddy(e.target.value)}
        placeholder="Buddy-এর নাম"
        className="w-full rounded-input border border-line bg-bg px-3.5 py-3 font-bn text-sm text-text outline-none focus:border-green"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="ফোন নম্বর (ঐচ্ছিক)"
        className="w-full rounded-input border border-line bg-bg px-3.5 py-3 font-en text-sm text-text outline-none focus:border-green"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ইমেইল (ঐচ্ছিক)"
        className="w-full rounded-input border border-line bg-bg px-3.5 py-3 font-en text-sm text-text outline-none focus:border-green"
      />
      {error && <p className="text-xs font-semibold text-err-tx">{error}</p>}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="flex items-center justify-center gap-1.5 rounded-input bg-green px-3.5 py-3 font-en text-sm font-bold text-white transition-transform active:scale-[0.97] disabled:opacity-60"
      >
        <Icon name="userCheck" size={16} />
        {isPending ? "Saving…" : success ? "Saved" : "Assign Buddy"}
      </button>
    </div>
  );
}
