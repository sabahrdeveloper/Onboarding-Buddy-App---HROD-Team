"use client";

import { useState, useTransition } from "react";
import {
  previewEmployeeForBroadcast,
  sendBroadcastToAll,
  sendBroadcastToEmployee,
  type EmployeePreview,
} from "@/actions/super-admin-notifications";

const inputClass =
  "w-full rounded-input border border-line bg-card px-3.5 py-2.5 font-en text-[14px] text-text outline-none focus:border-green";

export function SuperAdminNotificationComposer({ variants }: { variants: { id: string; name: string }[] }) {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");

  const [allTitle, setAllTitle] = useState("");
  const [allBody, setAllBody] = useState("");
  const [allSent, setAllSent] = useState(false);
  const [allError, setAllError] = useState<string | null>(null);
  const [allPending, startAllTransition] = useTransition();

  const [enrollNumber, setEnrollNumber] = useState("");
  const [employee, setEmployee] = useState<EmployeePreview | null>(null);
  const [empTitle, setEmpTitle] = useState("");
  const [empBody, setEmpBody] = useState("");
  const [empError, setEmpError] = useState<string | null>(null);
  const [empSent, setEmpSent] = useState(false);
  const [empPending, startEmpTransition] = useTransition();

  function resetForVariantChange(nextVariantId: string) {
    setVariantId(nextVariantId);
    setEmployee(null);
    setEmpError(null);
    setAllError(null);
  }

  function handleSendAll() {
    setAllError(null);
    setAllSent(false);
    startAllTransition(async () => {
      const formData = new FormData();
      formData.set("title", allTitle);
      formData.set("body", allBody);
      const result = await sendBroadcastToAll(variantId, formData);
      if (result.error) {
        setAllError(result.error);
        return;
      }
      setAllSent(true);
      setAllBody("");
    });
  }

  function handlePreview() {
    setEmpError(null);
    setEmpSent(false);
    startEmpTransition(async () => {
      const result = await previewEmployeeForBroadcast(enrollNumber, variantId);
      if (result.error) {
        setEmployee(null);
        setEmpError(result.error);
        return;
      }
      setEmployee(result.employee ?? null);
    });
  }

  function handleSendEmployee() {
    if (!employee) return;
    setEmpError(null);
    startEmpTransition(async () => {
      const formData = new FormData();
      formData.set("title", empTitle);
      formData.set("body", empBody);
      const result = await sendBroadcastToEmployee(employee.enrollNumber, variantId, formData);
      if (result.error) {
        setEmpError(result.error);
        return;
      }
      setEmpSent(true);
      setEmpBody("");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-1.5 block font-en text-[13px] font-semibold text-text">Module</label>
        <select
          value={variantId}
          onChange={(e) => resetForVariantChange(e.target.value)}
          className={inputClass}
        >
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-3 font-en text-[15px] font-bold text-text">Notify All</div>
        <div className="flex flex-col gap-3.5">
          <input value={allTitle} onChange={(e) => setAllTitle(e.target.value)} placeholder="Title (optional)" className={inputClass} />
          <textarea
            value={allBody}
            onChange={(e) => setAllBody(e.target.value)}
            placeholder="Message"
            rows={3}
            className={inputClass}
          />
          {allError && <p className="text-[12.5px] font-semibold text-err-tx">{allError}</p>}
          <button
            type="button"
            onClick={handleSendAll}
            disabled={allPending || !allBody.trim()}
            className="rounded-button bg-green px-4 py-3 font-en text-sm font-bold text-white disabled:opacity-60"
          >
            {allPending ? "Sending…" : allSent ? "Sent" : "Send to Everyone"}
          </button>
        </div>
      </div>

      <div className="border-t border-line pt-6">
        <div className="mb-3 font-en text-[15px] font-bold text-text">Notify Employee</div>
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
              disabled={empPending || !enrollNumber.trim()}
              className="shrink-0 rounded-input border border-line px-4 py-2.5 font-en text-[13px] font-bold text-text disabled:opacity-50"
            >
              Preview
            </button>
          </div>

          {empError && <p className="text-[12.5px] font-semibold text-err-tx">{empError}</p>}

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
              <input
                value={empTitle}
                onChange={(e) => setEmpTitle(e.target.value)}
                placeholder="Title (optional)"
                className={inputClass}
              />
              <textarea
                value={empBody}
                onChange={(e) => setEmpBody(e.target.value)}
                placeholder="Message"
                rows={3}
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleSendEmployee}
                disabled={empPending || !empBody.trim()}
                className="rounded-button bg-green px-4 py-3 font-en text-sm font-bold text-white disabled:opacity-60"
              >
                {empPending ? "Sending…" : empSent ? "Sent" : "Send"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
