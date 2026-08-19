"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadLeaderboardPhoto } from "@/actions/leaderboard-photo";

export function PhotoUploadForm({ bn: isBn }: { bn?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await uploadLeaderboardPhoto(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/leaderboard");
  }

  return (
    <form action={handleSubmit} className="flex flex-col items-center gap-4">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-line bg-bg">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[12px] font-medium text-muted">{isBn ? "প্রিভিউ" : "Preview"}</span>
        )}
      </div>
      <input
        type="file"
        name="photo"
        accept="image/jpeg,image/png"
        required
        onChange={(e) => {
          const file = e.target.files?.[0];
          setPreview(file ? URL.createObjectURL(file) : null);
        }}
        className="w-full text-[13px] font-medium text-text"
      />
      {error && <div className="w-full rounded-lg bg-warn-bg px-3 py-2 text-[12.5px] font-semibold text-warn-tx">{error}</div>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-button bg-green px-4 py-3.5 font-en text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? (isBn ? "আপলোড হচ্ছে…" : "Uploading…") : isBn ? "আপলোড করুন" : "Upload"}
      </button>
    </form>
  );
}
