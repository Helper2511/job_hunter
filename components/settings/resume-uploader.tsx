"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResumeUploader({ onUploaded, compact = false }: { onUploaded?: () => void; compact?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [roleType, setRoleType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a PDF file.");
      return;
    }
    setPending(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("label", label);
    form.set("roleType", roleType);
    const res = await fetch("/api/resumes/upload", { method: "POST", body: form }).catch(() => null);
    setPending(false);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res || !res.ok) {
      setError(data.error ?? "Upload failed. Check your connection and try again.");
      return;
    }
    toast.success(data.hasText ? "Resume uploaded" : "Resume uploaded. Its text could not be read, so matching will be limited.");
    setLabel("");
    setRoleType("");
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
    onUploaded?.();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resume-file">Resume (PDF, up to 5 MB)</Label>
        <label
          htmlFor="resume-file"
          className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed border-border-strong bg-surface p-4 text-center hover:bg-background"
        >
          <Upload className="size-5 text-muted" aria-hidden />
          <span>{fileName ?? "Choose a PDF"}</span>
        </label>
        <input
          ref={fileRef}
          id="resume-file"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </div>
      {!compact ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resume-label">Name</Label>
            <Input id="resume-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Frontend" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resume-role">Use for job titles containing</Label>
            <Input id="resume-role" value={roleType} onChange={(e) => setRoleType(e.target.value)} placeholder="e.g. frontend" />
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant={compact ? "primary" : "secondary"} disabled={pending} className="self-start">
        {pending ? "Uploading…" : "Upload resume"}
      </Button>
    </form>
  );
}
