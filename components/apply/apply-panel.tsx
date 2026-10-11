"use client";

import { Check, Copy, Download, ExternalLink, FileText, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { markNotApplied } from "@/app/actions/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { linkSocial } from "@/lib/auth-client";
import { GMAIL_SEND_SCOPE } from "@/lib/constants";

interface Props {
  job: { id: string; title: string; company: string; applyUrl: string | null; hrEmail: string | null; careersUrl: string | null };
  resumes: { id: string; label: string; fileName: string }[];
  defaultResumeId: string | null;
  profile: { name: string; email: string; phone: string | null; noticePeriod: string | null; linkedinUrl: string | null };
  gmail: { connected: boolean; address: string | null; googleConfigured: boolean };
  emailsLeft: number;
  status: string | null;
}

function CopyRow({ label, value }: { label: string; value: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <li className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0">
      <div className="min-w-0">
        <p className="text-small text-muted">{label}</p>
        <p className="truncate">{value}</p>
      </div>
      <Button
        variant="quiet"
        size="icon"
        aria-label={`Copy ${label.toLowerCase()}`}
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast("Copied");
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      </Button>
    </li>
  );
}

function ResumePicker({ resumes, value, onChange }: { resumes: Props["resumes"]; value: string; onChange: (v: string) => void }) {
  if (!resumes.length) {
    return (
      <p className="rounded-[8px] border border-border p-3 text-muted">
        No resume yet.{" "}
        <Link href="/settings#resumes" className="text-accent hover:underline">
          Upload one in Settings
        </Link>
        .
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="apply-resume">Resume</Label>
      <div className="flex gap-2">
        <NativeSelect id="apply-resume" value={value} onChange={(e) => onChange(e.target.value)}>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </NativeSelect>
        <Button asChild variant="secondary" size="icon" aria-label="Download resume">
          <a href={`/api/resumes/${value}/download`}>
            <Download aria-hidden />
          </a>
        </Button>
      </div>
    </div>
  );
}

function Done({ jobId, onUndo }: { jobId: string; onUndo: () => void }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-start gap-3 rounded-[8px] border border-border p-4" role="status">
      <p className="flex items-center gap-2 font-medium">
        <Check className="size-5 text-accent" aria-hidden /> Added to your tracker as Applied.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="primary">
          <Link href="/applications">View in tracker</Link>
        </Button>
        <Button
          variant="quiet"
          onClick={async () => {
            await markNotApplied(jobId);
            toast("Marked as not applied");
            onUndo();
            router.refresh();
          }}
        >
          Mark as not applied
        </Button>
      </div>
    </div>
  );
}

export function ApplyPanel({ job, resumes, defaultResumeId, profile, gmail, emailsLeft, status }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resumeId, setResumeId] = useState(defaultResumeId ?? resumes[0]?.id ?? "");
  const [done, setDone] = useState(false);
  const alreadyApplied = status && status !== "SAVED";

  // Email draft
  const [to, setTo] = useState(job.hrEmail ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const draftRequested = useRef(false);

  useEffect(() => {
    if (!open || !job.hrEmail || draftRequested.current) return;
    draftRequested.current = true;
    setDrafting(true);
    fetch("/api/email/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, resumeId: resumeId || undefined }),
    })
      .then((r) => r.json())
      .then((d) => {
        setSubject(d.subject ?? "");
        setBody(d.body ?? "");
      })
      .catch(() => setEmailError("The draft could not be written. Write your own message below."))
      .finally(() => setDrafting(false));
  }, [open, job.hrEmail, job.id, resumeId]);

  async function recordApplied(method: "apply_link" | "manual") {
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, method, resumeId: resumeId || undefined }),
    });
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else toast.error("Could not update your tracker. Try again.");
  }

  async function send() {
    setEmailError(null);
    if (!resumeId) {
      setEmailError("Upload a resume in Settings first.");
      return;
    }
    setSending(true);
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id, resumeId, to, subject, body }),
    }).catch(() => null);
    setSending(false);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res || !res.ok) {
      setEmailError(data.error ?? "The email was not sent. Check your connection and try again.");
      return;
    }
    toast.success("Sent from your Gmail");
    setDone(true);
    router.refresh();
  }

  const linkPane = (
    <div className="flex flex-col gap-4">
      <ResumePicker resumes={resumes} value={resumeId} onChange={setResumeId} />
      <div>
        <h3 className="mb-1 font-medium">Copy-ready answers</h3>
        <ul className="rounded-[8px] border border-border px-3">
          <CopyRow label="Full name" value={profile.name} />
          <CopyRow label="Email" value={profile.email} />
          <CopyRow label="Phone" value={profile.phone} />
          <CopyRow label="Notice period" value={profile.noticePeriod} />
          <CopyRow label="LinkedIn" value={profile.linkedinUrl} />
        </ul>
        {!profile.phone || !profile.noticePeriod ? (
          <p className="mt-1 text-small text-muted">
            Add your phone and notice period in{" "}
            <Link href="/settings" className="text-accent hover:underline">
              Settings
            </Link>{" "}
            to copy them here.
          </p>
        ) : null}
      </div>
      {job.applyUrl ? (
        <Button asChild variant="primary">
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              void recordApplied("apply_link");
            }}
          >
            Open application page <ExternalLink aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
      ) : null}
      <p className="text-small text-muted">Opening the page adds this job to your tracker as Applied. You can undo it.</p>
    </div>
  );

  const emailPane = (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      {!gmail.connected ? (
        <div className="rounded-[8px] border border-border p-3">
          <p>Connect Gmail to send your resume from your own address. JobHunt can only send mail, never read it.</p>
          <Button
            type="button"
            variant="primary"
            className="mt-3"
            disabled={!gmail.googleConfigured}
            onClick={() => linkSocial({ provider: "google", scopes: [GMAIL_SEND_SCOPE], callbackURL: window.location.pathname })}
          >
            <Mail aria-hidden /> Connect Gmail
          </Button>
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mail-to">To</Label>
        <Input id="mail-to" type="email" required value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mail-subject">Subject</Label>
        <Input id="mail-subject" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={drafting ? "Writing a draft…" : ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mail-body">Message</Label>
        <Textarea id="mail-body" required rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder={drafting ? "Writing a draft…" : ""} />
        <p className="text-small text-muted">Draft, edit freely before sending.</p>
      </div>
      <ResumePicker resumes={resumes} value={resumeId} onChange={setResumeId} />
      {resumeId ? (
        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-neutral-badge px-3 py-1 text-small">
          <FileText className="size-4" aria-hidden />
          {resumes.find((r) => r.id === resumeId)?.fileName ?? "resume.pdf"}
        </p>
      ) : null}
      {emailError ? (
        <p role="alert" className="text-danger">
          {emailError}
        </p>
      ) : null}
      <Button type="submit" variant="primary" disabled={!gmail.connected || sending || drafting || emailsLeft === 0}>
        {sending ? "Sending…" : "Send from Gmail"}
      </Button>
      <p className="text-small text-muted">
        {gmail.connected ? `Sends from ${gmail.address ?? "your Gmail address"}. ` : ""}
        {emailsLeft === 0 ? "You reached today’s limit of emails. It resets tomorrow." : `${emailsLeft} emails left today.`}
      </p>
    </form>
  );

  const manualPane = (
    <div className="flex flex-col gap-3">
      <p>This job has no apply link or HR email. Apply on the company’s careers page, then mark it here.</p>
      {job.careersUrl ? (
        <Button asChild variant="secondary">
          <a href={job.careersUrl} target="_blank" rel="noopener noreferrer">
            Open careers page <ExternalLink aria-hidden />
          </a>
        </Button>
      ) : null}
      <Button variant="primary" onClick={() => recordApplied("manual")}>
        Mark as applied
      </Button>
    </div>
  );

  const hasLink = Boolean(job.applyUrl);
  const hasEmail = Boolean(job.hrEmail);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setDone(false);
      }}
    >
      <SheetTrigger asChild>
        <Button variant="primary" className="w-full lg:w-auto">
          {alreadyApplied ? "Apply again" : "Apply"}
        </Button>
      </SheetTrigger>
      <SheetContent title={`Apply: ${job.title}`} description={job.company}>
        {done ? (
          <Done jobId={job.id} onUndo={() => setDone(false)} />
        ) : hasLink && hasEmail ? (
          <Tabs defaultValue="link">
            <TabsList>
              <TabsTrigger value="link">Apply link</TabsTrigger>
              <TabsTrigger value="email">Email HR</TabsTrigger>
            </TabsList>
            <TabsContent value="link">{linkPane}</TabsContent>
            <TabsContent value="email">{emailPane}</TabsContent>
          </Tabs>
        ) : hasLink ? (
          linkPane
        ) : hasEmail ? (
          emailPane
        ) : (
          manualPane
        )}
      </SheetContent>
    </Sheet>
  );
}
