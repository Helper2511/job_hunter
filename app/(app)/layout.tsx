import Link from "next/link";
import { BottomNav, SidebarNav } from "@/components/shell/nav";
import { Notifications } from "@/components/shell/notifications";
import { UserMenu } from "@/components/shell/user-menu";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await db.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1280px]">
      {/* Tablet: icon sidebar. Desktop: full 240px sidebar. */}
      <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col border-r border-border bg-surface px-2 py-4 md:flex lg:w-60 lg:px-3">
        <Link href="/jobs" className="mb-6 flex min-h-11 items-center gap-2 px-1 font-semibold lg:px-3">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-[6px] bg-accent text-on-accent">J</span>
          <span className="sr-only lg:not-sr-only">JobHunt</span>
        </Link>
        <nav aria-label="Main" className="flex-1">
          <div className="lg:hidden">
            <SidebarNav collapsed />
          </div>
          <div className="hidden lg:block">
            <SidebarNav />
          </div>
        </nav>
        <div className="flex flex-col gap-1 border-t border-border pt-3">
          <div className="lg:hidden flex flex-col gap-1">
            <Notifications unread={unread} compact />
            <UserMenu name={user.name} email={user.email} image={user.image} compact />
          </div>
          <div className="hidden lg:flex lg:flex-col lg:gap-1">
            <Notifications unread={unread} />
            <UserMenu name={user.name} email={user.email} image={user.image} />
          </div>
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 pb-24 md:pb-0">
        <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
          <Link href="/jobs" className="flex items-center gap-2 font-semibold">
            <span aria-hidden className="flex size-7 items-center justify-center rounded-[6px] bg-accent text-on-accent">J</span>
            JobHunt
          </Link>
          <Notifications unread={unread} compact side="bottom" />
        </div>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
