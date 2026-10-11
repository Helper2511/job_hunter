"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { correctCompanyType, recheckCompany, unwatchCompany, watchCompany } from "@/app/actions/companies";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { COMPANY_TYPES } from "@/lib/constants";
import type { CompanyType } from "@/lib/providers/types";

export function ChangeTypeMenu({ companyId, label }: { companyId: string; label: string }) {
  const router = useRouter();
  const [, start] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="min-h-11 text-accent underline-offset-4 hover:underline md:min-h-0">{label}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        <DropdownMenuLabel>What kind of company is this?</DropdownMenuLabel>
        {COMPANY_TYPES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onSelect={() =>
              start(async () => {
                await correctCompanyType(companyId, t.value as CompanyType);
                toast.success(`Set to ${t.label} for you. Sent for review.`);
                router.refresh();
              })
            }
          >
            <span className="flex flex-col">
              <span>{t.label}</span>
              <span className="text-small text-muted">{t.hint}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CompanyActions({ companyId, watching }: { companyId: string; watching: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await recheckCompany(companyId);
            if (res.status === "ok") toast.success(`Checked: ${res.found} open role${res.found === 1 ? "" : "s"}`);
            else if (res.status === "manual") toast("This careers page needs a manual check");
            else toast.error(res.message ?? "Could not reach this careers page. Try again later.");
            router.refresh();
          })
        }
      >
        <RefreshCw className={pending ? "animate-spin" : ""} aria-hidden />
        {pending ? "Checking…" : "Check now"}
      </Button>
      <Button
        variant="quiet"
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (watching) await unwatchCompany(companyId);
            else await watchCompany(companyId);
            toast(watching ? "Removed from watchlist" : "Added to watchlist");
            router.refresh();
          })
        }
      >
        {watching ? "Stop watching" : "Watch"}
      </Button>
    </div>
  );
}
