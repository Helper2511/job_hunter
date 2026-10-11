"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { savePrep, type PrepInput } from "@/app/actions/prep";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PrepQuestion } from "@/lib/prep/questions";

const TYPE_LABEL: Record<PrepQuestion["type"], string> = {
  technical: "Technical",
  role: "Role",
  behavioural: "Behavioural",
  own: "Your question",
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}

function DraftNote({ show }: { show: boolean }) {
  return show ? <span className="text-small text-muted">Draft, edit freely</span> : null;
}

let localId = 0;
const newId = (p: string) => `${p}_${Date.now().toString(36)}_${(localId++).toString(36)}`;

export function PrepEditor({ applicationId, initial }: { applicationId: string; initial: PrepInput }) {
  const [data, setData] = useState<PrepInput>(initial);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [focus, setFocus] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newCheck, setNewCheck] = useState("");
  const [summaryEdited, setSummaryEdited] = useState(false);
  const [notesEdited, setNotesEdited] = useState(false);
  const first = useRef(true);

  // Save a moment after the last change.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaving("saving");
    const t = setTimeout(async () => {
      try {
        const res = await savePrep(applicationId, data);
        setSaving("error" in res ? "error" : "saved");
      } catch {
        setSaving("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [data, applicationId]);

  const update = (patch: Partial<PrepInput>) => setData((d) => ({ ...d, ...patch }));

  async function regenerate() {
    setRegenerating(true);
    const res = await fetch("/api/prep/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, focus: focus || undefined }),
    }).catch(() => null);
    setRegenerating(false);
    if (!res?.ok) {
      toast.error("New questions could not be written. Try again.");
      return;
    }
    const { questions } = (await res.json()) as { questions: PrepQuestion[] };
    // Keep anything the user answered or wrote; replace untouched drafts.
    setData((d) => ({ ...d, questions: [...d.questions.filter((q) => !q.draft || q.answer.trim() || q.type === "own"), ...questions] }));
    toast.success("Questions updated");
  }

  return (
    <div className="mt-6 flex flex-col gap-10">
      <p className="sticky top-0 z-10 -mb-8 bg-background py-1 text-right text-small text-muted" aria-live="polite">
        {saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : saving === "error" ? "Not saved. Check your connection." : ""}
      </p>

      <section aria-labelledby="sec-interview">
        <h2 id="sec-interview" className="text-section font-semibold">
          Interview
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-when">Date and time</Label>
            <Input
              id="p-when"
              type="datetime-local"
              value={toLocalInput(data.interviewAt)}
              onChange={(e) => update({ interviewAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
            />
            <p className="text-small text-muted">We remind you a day before and an hour before.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-round">Round type</Label>
            <Input id="p-round" value={data.roundType ?? ""} onChange={(e) => update({ roundType: e.target.value || null })} placeholder="e.g. Technical round 1" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="p-people">Interviewer names</Label>
            <Input id="p-people" value={data.interviewers ?? ""} onChange={(e) => update({ interviewers: e.target.value || null })} placeholder="e.g. Priya (Engineering manager)" />
          </div>
        </div>

        <h3 className="mt-6 font-medium">Checklist</h3>
        <ul className="mt-2 flex flex-col">
          {data.checklist.map((c) => (
            <li key={c.id} className="flex min-h-11 items-center gap-3">
              <Checkbox
                id={`chk-${c.id}`}
                checked={c.done}
                onCheckedChange={(v) => update({ checklist: data.checklist.map((x) => (x.id === c.id ? { ...x, done: Boolean(v) } : x)) })}
              />
              <label htmlFor={`chk-${c.id}`} className={c.done ? "flex-1 text-muted line-through" : "flex-1"}>
                {c.label}
              </label>
              <Button variant="quiet" size="icon" aria-label={`Remove “${c.label}”`} onClick={() => update({ checklist: data.checklist.filter((x) => x.id !== c.id) })}>
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newCheck.trim()) return;
            update({ checklist: [...data.checklist, { id: newId("c"), label: newCheck.trim(), done: false }] });
            setNewCheck("");
          }}
        >
          <Input aria-label="New checklist item" value={newCheck} onChange={(e) => setNewCheck(e.target.value)} placeholder="Add an item" />
          <Button type="submit" variant="secondary">
            <Plus aria-hidden /> Add
          </Button>
        </form>
      </section>

      <section aria-labelledby="sec-summary">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="sec-summary" className="text-section font-semibold">
            Role summary
          </h2>
          <DraftNote show={!summaryEdited && Boolean(initial.roleSummary)} />
        </div>
        <Textarea
          aria-labelledby="sec-summary"
          className="mt-2"
          rows={7}
          value={data.roleSummary ?? ""}
          onChange={(e) => {
            setSummaryEdited(true);
            update({ roleSummary: e.target.value });
          }}
          placeholder="Key responsibilities and must-have skills"
        />
      </section>

      <section aria-labelledby="sec-gap">
        <h2 id="sec-gap" className="text-section font-semibold">
          Skills gap
        </h2>
        {data.skillsGap.length ? (
          <>
            <p className="mt-1 text-muted">Skills in the job description that your resume does not show clearly.</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {data.skillsGap.map((s) => (
                <li key={s}>
                  <Badge>{s}</Badge>
                </li>
              ))}
            </ul>
            <h3 className="mt-4 font-medium">Study list</h3>
            <ul className="mt-1 list-disc pl-5">
              {data.studyList.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1 text-muted">No listed skills are missing from your resume. Read the full job description for anything to brush up on.</p>
        )}
      </section>

      <section aria-labelledby="sec-questions">
        <h2 id="sec-questions" className="text-section font-semibold">
          Likely questions
        </h2>
        <form
          className="mt-2 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void regenerate();
          }}
        >
          <Input aria-label="Focus for new questions" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. more system design, more React" />
          <Button type="submit" variant="secondary" disabled={regenerating}>
            {regenerating ? "Writing…" : "Regenerate"}
          </Button>
        </form>
        <Accordion type="multiple" className="mt-3">
          {data.questions.map((q) => (
            <AccordionItem key={q.id} value={q.id}>
              <AccordionTrigger>
                <span className="flex flex-col gap-0.5">
                  <span className="text-small font-normal text-muted">
                    {TYPE_LABEL[q.type]}
                    {q.draft && !q.answer ? " · Draft, edit freely" : ""}
                  </span>
                  <span>{q.question}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Label htmlFor={`ans-${q.id}`}>Your answer</Label>
                <Textarea
                  id={`ans-${q.id}`}
                  className="mt-1.5"
                  rows={5}
                  value={q.answer}
                  onChange={(e) => update({ questions: data.questions.map((x) => (x.id === q.id ? { ...x, answer: e.target.value, draft: false } : x)) })}
                />
                <Button variant="quiet" size="sm" className="mt-2" onClick={() => update({ questions: data.questions.filter((x) => x.id !== q.id) })}>
                  <Trash2 aria-hidden /> Remove question
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newQuestion.trim()) return;
            update({ questions: [...data.questions, { id: newId("q"), type: "own", question: newQuestion.trim(), answer: "", draft: false }] });
            setNewQuestion("");
          }}
        >
          <Input aria-label="Add your own question" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Add your own question" />
          <Button type="submit" variant="secondary">
            <Plus aria-hidden /> Add
          </Button>
        </form>
      </section>

      <section aria-labelledby="sec-company">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="sec-company" className="text-section font-semibold">
            Company notes
          </h2>
          <DraftNote show={!notesEdited} />
        </div>
        <Textarea
          aria-labelledby="sec-company"
          className="mt-2"
          rows={8}
          value={data.companyNotes ?? ""}
          onChange={(e) => {
            setNotesEdited(true);
            update({ companyNotes: e.target.value });
          }}
        />
      </section>

      <section aria-labelledby="sec-rounds">
        <h2 id="sec-rounds" className="text-section font-semibold">
          Round notes
        </h2>
        <p className="mt-1 text-muted">How each round went and what came next.</p>
        <Textarea aria-labelledby="sec-rounds" className="mt-2" rows={6} value={data.roundNotes ?? ""} onChange={(e) => update({ roundNotes: e.target.value })} />
      </section>
    </div>
  );
}
