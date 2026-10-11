import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButtons } from "@/components/auth/sign-in-buttons";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/jobs";
  if (await getSession()) redirect(safeNext);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-2 font-semibold">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-[6px] bg-accent text-on-accent">J</span>
          JobHunt Hub
        </Link>
        <h1 className="text-page font-semibold">Sign in</h1>
        <p className="mb-6 mt-1 text-muted">Pick up where you left off.</p>
        <SignInButtons next={safeNext} />
      </div>
    </main>
  );
}
