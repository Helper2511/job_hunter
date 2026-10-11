"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NativeSelect } from "@/components/ui/select";
import { COMPANY_TYPES } from "@/lib/constants";

export function CompanyTypeSelect() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <label className="flex items-center gap-2 text-small text-muted">
      Type
      <NativeSelect
        className="w-auto"
        value={params.get("type") ?? ""}
        onChange={(e) => router.replace(e.target.value ? `${pathname}?type=${e.target.value}` : pathname)}
      >
        <option value="">All types</option>
        {COMPANY_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
        <option value="unknown">Not classified</option>
      </NativeSelect>
    </label>
  );
}
