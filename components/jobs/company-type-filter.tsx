"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleChip, ToggleGroup } from "@/components/ui/toggle-group";
import { COMPANY_TYPES } from "@/lib/constants";
import type { CompanyType } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

interface Props {
  value: CompanyType[];
  hideUnclassified: boolean;
  onChange: (types: CompanyType[], hideUnclassified: boolean) => void;
}

export function CompanyTypeFilter({ value, hideUnclassified, onChange }: Props) {
  const active = value.length > 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[15px] md:min-h-9",
          active ? "border-accent-soft bg-accent-soft font-medium text-accent-soft-foreground" : "border-border-strong bg-surface",
        )}
      >
        {active ? `Company type · ${value.length}` : "Company type"}
        <ChevronDown className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        {COMPANY_TYPES.map((t) => (
          <DropdownMenuCheckboxItem
            key={t.value}
            checked={value.includes(t.value)}
            hint={t.hint}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(on) =>
              onChange(on ? [...value, t.value] : value.filter((v) => v !== t.value), hideUnclassified)
            }
          >
            {t.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={hideUnclassified}
          onSelect={(e) => e.preventDefault()}
          onCheckedChange={(on) => onChange(value, Boolean(on))}
        >
          Hide not classified
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Mobile: the same choice as toggle chips inside the filters sheet. */
export function CompanyTypeChips({ value, onChange }: { value: CompanyType[]; onChange: (v: CompanyType[]) => void }) {
  return (
    <ToggleGroup type="multiple" aria-label="Company type" value={value} onValueChange={(v) => onChange(v as CompanyType[])} className="flex flex-wrap gap-2">
      {COMPANY_TYPES.map((t) => (
        <ToggleChip key={t.value} value={t.value} title={t.hint}>
          {t.label}
        </ToggleChip>
      ))}
    </ToggleGroup>
  );
}
