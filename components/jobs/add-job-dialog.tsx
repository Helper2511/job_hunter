"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddJobDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [needsDetails, setNeedsDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch("/api/jobs/import-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, title: title || undefined, company: company || undefined }),
    }).catch(() => null);
    setPending(false);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res || !res.ok) {
      setError(data.error ?? "Could not add this job. Check the web address and try again.");
      if (data.needsDetails) setNeedsDetails(true);
      return;
    }
    toast.success("Job added");
    setOpen(false);
    setUrl("");
    setTitle("");
    setCompany("");
    setNeedsDetails(false);
    router.push(`/jobs/${data.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="Add a job" description="Paste any job link. We read the page once and save the job.">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="job-url">Job link</Label>
            <Input id="job-url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://jobs.lever.co/acme/…" />
          </div>
          {needsDetails ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="job-title">Job title</Label>
                <Input id="job-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend Engineer" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="job-company">Company</Label>
                <Input id="job-company" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme Tech" />
              </div>
            </>
          ) : null}
          {error ? (
            <p role="alert" className="text-small text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="quiet" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Reading the page…" : "Add job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
