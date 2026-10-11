"use client";

import { ToggleChip, ToggleGroup } from "@/components/ui/toggle-group";
import { WORK_MODES } from "@/lib/constants";
import type { WorkMode } from "@/lib/providers/types";

export function WorkModeChips({ value, onChange }: { value: WorkMode[]; onChange: (v: WorkMode[]) => void }) {
  return (
    <ToggleGroup
      type="multiple"
      aria-label="Work mode"
      value={value}
      onValueChange={(v) => onChange(v as WorkMode[])}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:pb-0 [scrollbar-width:none]"
    >
      {WORK_MODES.map((m) => (
        <ToggleChip key={m.value} value={m.value}>
          {m.label}
        </ToggleChip>
      ))}
    </ToggleGroup>
  );
}
