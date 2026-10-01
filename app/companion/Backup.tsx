"use client";

import { useRef, useState } from "react";
import { Download, HardDrive, Upload } from "lucide-react";
import type { CompanionState } from "@/lib/companion/types";
import { COMPANION_STORAGE_KEY, mergeState } from "./useCompanionState";
import { Card, CardTitle, Notice } from "./ui";

const pad = (n: number) => String(n).padStart(2, "0");

export default function Backup({
  className = "",
  state,
  replace,
}: {
  className?: string;
  state: CompanionState;
  replace: (next: CompanionState) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);

  const onExport = () => {
    const d = new Date();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${COMPANION_STORAGE_KEY}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setMessage(null);
  };

  const onFile = async (file: File) => {
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        throw new Error("That file isn't valid JSON.");
      }
      if (typeof parsed !== "object" || parsed === null || (parsed as { version?: unknown }).version !== 1) {
        throw new Error("Not a companion backup: expected a JSON file with \"version\": 1.");
      }
      if (!window.confirm("Replace your current companion data with this backup?")) return;
      const restored = mergeState(parsed);
      replace(restored);
      const droppedBank = (parsed as { bank?: unknown }).bank != null && restored.bank === null;
      setMessage(
        droppedBank
          ? { tone: "error", text: `Restored from ${file.name}, without its bank import: its date is missing, invalid or in the future. Paste your bank again.` }
          : { tone: "info", text: `Restored from ${file.name}.` }
      );
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : String(err) });
    }
  };

  return (
    <Card className={className} aria-labelledby="backup-title">
      <CardTitle id="backup-title" icon={HardDrive}>
        Backup
      </CardTitle>
      <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
        Everything here lives in this browser only. Export a copy to move it to another device or keep it safe.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onExport}
          aria-label="Export backup"
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" aria-hidden /> Export
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Import backup"
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" aria-hidden /> Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onFile(file);
          }}
        />
      </div>
      {message && (
        <div className="mt-3">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}
    </Card>
  );
}
