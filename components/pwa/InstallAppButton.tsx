"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton({ bn: isBn }: { bn?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // No button when there's nothing to trigger — already installed, or the
  // browser never fired the prompt event (iOS Safari has no
  // beforeinstallprompt at all; that platform only supports the manual
  // Share → Add to Home Screen flow, which this button can't invoke).
  if (!deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-button bg-green px-4 py-3.5 font-en text-sm font-bold text-white transition-transform active:scale-[0.98]"
    >
      <Icon name="monitor" size={16} />
      {isBn ? "অ্যাপ হিসেবে ইনস্টল করুন" : "Install as App"}
    </button>
  );
}
