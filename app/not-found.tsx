import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-page font-semibold">Page not found</h1>
      <p className="text-muted">This job or page may have been removed.</p>
      <Link href="/jobs" className="text-accent hover:underline">
        Back to jobs
      </Link>
    </main>
  );
}
