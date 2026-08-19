"use client";

import { useState, useTransition } from "react";
import {
  previewEmployeeForNotification,
  sendNotificationToEmployee,
  type EmployeePreview,
} from "@/actions/admin-notifications";

const inputClass =
  "w-full rounded-input border border-line bg-card px-3.5 py-2.5 font-en text-[14px] text-text outline-none focus:border-green";

export function EmployeeNotificationForm() {
  const [enrollNumber, setEnrollNumber] = useState("");
  const [employee, setEmployee] = useState<EmployeePreview | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handlePreview() {
    setError(null);
    setSent(false);
    startTransition(async () => {
      const result = await previewEmployeeForNotification(enrollNumber);
      if (result.error) {
        setEmployee(null);
        setError(result.error);
        return;
      }
      setEmployee(result.employee ?? null);
    });
  }

  function handleSend() {
    if (!employee) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("body", body);
      const result = await sendNotificationToEmployee(employee.enrollNumber, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSent(true);
      setBody("");
    });
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex gap-2">
        <input
          value={enrollNumber}
          onChange={(e) => {
            setEnrollNumber(e.target.value);
            setEmployee(null);
          }}
          placeholder="Enroll Number"
          className={inputClass}
        />
        <button
          type="button"
          onClick={handlePreview}
          disabled={isPending || !enrollNumber.trim()}
          className="shrink-0 rounded-input border border-line px-4 py-2.5 font-en text-[13px] font-bold text-text disabled:opacity-50"
        >
          Preview
        </button>
      </div>

      {error && <p className="text-[12.5px] font-semibold text-err-tx">{error}</p>}

      {employee && (
        <div className="rounded-card border border-line bg-bg p-3.5">
          <div className="text-[13.5px] font-bold text-text">{employee.name}</div>
          <div className="text-[12px] font-medium text-muted">
            {[employee.designation, employee.department].filter(Boolean).join(" · ") || employee.enrollNumber}
          </div>
        </div>
      )}

      {employee && (
        <>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className={inputClass} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message"
            rows={3}
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isPending || !body.trim()}
            className="rounded-button bg-green px-4 py-3 font-en text-sm font-bold text-white disabled:opacity-60"
          >
            {isPending ? "Sending…" : sent ? "Sent" : "Send"}
          </button>
        </>
      )}
    </div>
  );
}
