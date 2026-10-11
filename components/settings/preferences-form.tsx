"use client";

import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePreferences } from "@/app/actions/settings";
import { CompanyTypeChips } from "@/components/jobs/company-type-filter";
import { LocationPicker } from "@/components/jobs/location-picker";
import { WorkModeChips } from "@/components/jobs/work-mode-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyType, WorkMode } from "@/lib/providers/types";

export interface Preferences {
  roles: string[];
  workModes: WorkMode[];
  locations: string[];
  companyTypes: CompanyType[];
}

export function PreferencesForm({
  initial,
  submitLabel = "Save preferences",
  onSaved,
  finishOnboarding = false,
}: {
  initial: Preferences;
  submitLabel?: string;
  onSaved?: () => void;
  finishOnboarding?: boolean;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [role, setRole] = useState("");
  const [pending, start] = useTransition();

  function addRole() {
    const r = role.trim();
    if (r && !prefs.roles.includes(r)) setPrefs({ ...prefs, roles: [...prefs.roles, r].slice(0, 10) });
    setRole("");
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const roles = role.trim() && !prefs.roles.includes(role.trim()) ? [...prefs.roles, role.trim()] : prefs.roles;
          await updatePreferences({ ...prefs, roles }, finishOnboarding);
          setRole("");
          toast.success("Preferences saved");
          onSaved?.();
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pref-role">Roles you want</Label>
        {prefs.roles.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {prefs.roles.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-1 rounded-full bg-accent-soft px-2.5 text-[13px] text-accent-soft-foreground"
                  onClick={() => setPrefs({ ...prefs, roles: prefs.roles.filter((x) => x !== r) })}
                >
                  {r} <X className="size-3.5" aria-hidden />
                  <span className="sr-only">Remove {r}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex gap-2">
          <Input
            id="pref-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addRole();
              }
            }}
            placeholder="e.g. React developer"
          />
          <Button type="button" variant="secondary" onClick={addRole}>
            Add
          </Button>
        </div>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium">Work modes</legend>
        <WorkModeChips value={prefs.workModes} onChange={(workModes) => setPrefs({ ...prefs, workModes })} />
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium">Cities</legend>
        <LocationPicker inline value={prefs.locations} onChange={(locations) => setPrefs({ ...prefs, locations })} savedCities={[]} />
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-[13px] font-medium">Company types</legend>
        <CompanyTypeChips value={prefs.companyTypes} onChange={(companyTypes) => setPrefs({ ...prefs, companyTypes })} />
        <p className="mt-1 text-small text-muted">Leave empty for all types.</p>
      </fieldset>

      <Button type="submit" variant="primary" disabled={pending} className="self-start">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
