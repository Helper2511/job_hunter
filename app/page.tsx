import { Building2, KanbanSquare, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import { CareerPageOnlyTag } from "@/components/ui/badge";
import { getSession } from "@/lib/session";

const POINTS = [
  { icon: Search, title: "Find jobs in one place", text: "LinkedIn, Naukri and Glassdoor alerts plus company career pages, filtered by work mode and city." },
  { icon: Building2, title: "Spot career-page-only roles", text: "See openings on a company's own site that never made it to the job platforms." },
  { icon: KanbanSquare, title: "Track and prepare", text: "Every application in one board, with follow-up reminders and an interview prep page per job." },
];

function ProductPreview() {
  return (
    <div aria-hidden className="w-full max-w-md rounded-[8px] border border-border bg-surface p-3 shadow-sm">
      <div className="mb-3 flex gap-2">
        <span className="rounded-full bg-accent-soft px-3 py-1 text-[13px] text-accent-soft-foreground">Remote</span>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-[13px] text-accent-soft-foreground">Hybrid</span>
        <span className="rounded-full border border-border-strong px-3 py-1 text-[13px]">On-site</span>
      </div>
      {[
        { t: "Senior React Developer", c: "Acme Tech · SaaS", m: "Pune · Hybrid · 2d", cp: true },
        { t: "Frontend Engineer", c: "Bright Labs · Product", m: "Remote (India) · 5h", cp: false },
        { t: "Full-stack Engineer", c: "Northwind · Services", m: "Bengaluru · On-site · 1d", cp: false },
      ].map((j) => (
        <div key={j.t} className="mb-2 rounded-[8px] border border-border p-3 last:mb-0">
          <p className="font-semibold">{j.t}</p>
          <p className="text-small text-muted">{j.c}</p>
          <p className="text-small text-muted">{j.m}</p>
          {j.cp ? <CareerPageOnlyTag className="mt-2" /> : null}
        </div>
      ))}
    </div>
  );
}

export default async function Landing() {
  if (await getSession()) redirect("/jobs");
  return (
    <main className="mx-auto flex min-h-dvh max-w-[1280px] flex-col px-4 py-6 md:px-8">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-[6px] bg-accent text-on-accent">J</span>
          JobHunt Hub
        </span>
        <Link href="/sign-in" className="text-accent underline-offset-4 hover:underline">
          Sign in
        </Link>
      </header>

      <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-2">
        <div className="max-w-lg">
          <h1 className="text-[32px] font-semibold leading-10 md:text-[40px] md:leading-[48px]">
            Every job you are looking for, in one calm list.
          </h1>
          <p className="mt-4 text-muted">
            Search openings by city and work mode, find roles that only exist on company career pages, and send your resume
            when you are ready.
          </p>
          <div className="mt-8 max-w-sm">
            <SignInButtons next="/jobs" />
          </div>
        </div>
        <ProductPreview />
      </section>

      <section aria-label="What you get" className="grid gap-4 border-t border-border py-10 md:grid-cols-3">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <Icon className="mb-2 size-5 text-accent" aria-hidden />
            <h2 className="font-semibold">{title}</h2>
            <p className="text-muted">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
