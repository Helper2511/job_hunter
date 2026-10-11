"use client";

import { ChevronDown, MapPin, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { NativeSelect } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ANYWHERE_IN_INDIA, searchCities } from "@/lib/matching/cities";
import { cn } from "@/lib/utils";

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  savedCities: string[];
  radiusKm?: number;
  onRadiusChange?: (r: number | undefined) => void;
  /** Inline renders the field itself (filters sheet, onboarding); otherwise a compact button. */
  inline?: boolean;
}

function label(value: string[]): string {
  if (value.length === 0) return "Any location";
  if (value.length === 1) return value[0];
  return `${value[0]} +${value.length - 1}`;
}

export function LocationPicker({ value, onChange, savedCities, radiusKm, onRadiusChange, inline = false }: Props) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const results = useMemo(() => searchCities(term), [term]);

  function toggle(city: string) {
    onChange(value.includes(city) ? value.filter((c) => c !== city) : [...value, city]);
    setTerm("");
  }

  const list = (
    <Command shouldFilter={false} label="Choose locations">
      <CommandInput value={term} onValueChange={setTerm} placeholder="e.g. Bangalore" aria-label="Search cities" />
      <CommandList>
        {term ? (
          <>
            <CommandEmpty>No city found. Press Enter to add “{term}”.</CommandEmpty>
            <CommandGroup heading="Cities">
              {results.map((c) => (
                <CommandItem key={c} value={c} onSelect={() => toggle(c)}>
                  <Check on={value.includes(c)} /> {c}
                </CommandItem>
              ))}
              {results.length === 0 ? (
                <CommandItem value={`add-${term}`} onSelect={() => toggle(term.trim())}>
                  Add “{term.trim()}”
                </CommandItem>
              ) : null}
            </CommandGroup>
          </>
        ) : (
          <>
            {savedCities.length ? (
              <CommandGroup heading="Your cities">
                {savedCities.map((c) => (
                  <CommandItem key={c} value={`saved-${c}`} onSelect={() => toggle(c)}>
                    <Check on={value.includes(c)} /> {c}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            <CommandGroup heading="Wider">
              <CommandItem value="anywhere" onSelect={() => toggle(ANYWHERE_IN_INDIA)}>
                <Check on={value.includes(ANYWHERE_IN_INDIA)} /> {ANYWHERE_IN_INDIA}
              </CommandItem>
              <CommandItem value="ncr" onSelect={() => toggle("Delhi NCR")}>
                <Check on={value.includes("Delhi NCR")} /> Delhi NCR
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );

  const chips = value.length ? (
    <ul className="flex flex-wrap gap-1.5" aria-label="Chosen locations">
      {value.map((c) => (
        <li key={c}>
          <button
            type="button"
            onClick={() => toggle(c)}
            className="inline-flex min-h-8 items-center gap-1 rounded-full bg-accent-soft px-2.5 text-[13px] text-accent-soft-foreground"
          >
            {c}
            <X className="size-3.5" aria-hidden />
            <span className="sr-only">Remove {c}</span>
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  const radius =
    value.length === 1 && value[0] !== ANYWHERE_IN_INDIA && onRadiusChange ? (
      <label className="flex items-center gap-2 text-small text-muted">
        Within
        <NativeSelect
          className="w-auto min-h-9 py-1"
          value={radiusKm ?? ""}
          onChange={(e) => onRadiusChange(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">City only</option>
          <option value="10">10 km</option>
          <option value="25">25 km</option>
          <option value="50">50 km</option>
        </NativeSelect>
      </label>
    ) : null;

  if (inline) {
    return (
      <div className="flex flex-col gap-2">
        {chips}
        <div className="rounded-[8px] border border-border p-2">{list}</div>
        {radius}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[15px] md:min-h-9",
            value.length ? "border-accent-soft bg-accent-soft font-medium text-accent-soft-foreground" : "border-border-strong bg-surface",
          )}
        >
          <MapPin className="size-4" aria-hidden />
          {label(value)}
          <ChevronDown className="size-4" aria-hidden />
        </PopoverTrigger>
        <PopoverContent className="w-80">
          {chips ? <div className="mb-2">{chips}</div> : null}
          {list}
        </PopoverContent>
      </Popover>
      {radius}
    </div>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("flex size-4 items-center justify-center rounded-[4px] border border-border-strong text-[11px]", on && "border-accent bg-accent text-on-accent")}
    >
      {on ? "✓" : ""}
    </span>
  );
}
