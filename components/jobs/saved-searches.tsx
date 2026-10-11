"use client";

import { Bell, BellOff, ChevronDown, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createSavedSearch, deleteSavedSearch, toggleSavedSearchNotify } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryToParams } from "@/lib/matching/query";
import type { JobQuery } from "@/lib/providers/types";

export interface SavedSearchItem {
  id: string;
  name: string;
  query: JobQuery;
  notify: boolean;
}

export function SavedSearches({ items, current }: { items: SavedSearchItem[]; current: JobQuery }) {
  const router = useRouter();
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState("");
  const [notify, setNotify] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    if (!name.trim()) {
      setError("Give the search a name, for example “Remote React, India”.");
      return;
    }
    start(async () => {
      try {
        await createSavedSearch({ name, notify, query: { ...current } as Record<string, unknown> });
        setDialog(false);
        setName("");
        toast.success("Search saved");
        router.refresh();
      } catch {
        setError("Could not save the search. Try again.");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[6px] border border-border-strong bg-surface px-3 md:min-h-10">
          Saved
          <ChevronDown className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuItem onSelect={() => setDialog(true)} className="font-medium text-accent">
            Save this search
          </DropdownMenuItem>
          {items.length ? <DropdownMenuSeparator /> : null}
          {items.length ? <DropdownMenuLabel>Your searches</DropdownMenuLabel> : null}
          {items.map((s) => (
            <div key={s.id} className="flex items-center gap-1">
              <DropdownMenuItem className="flex-1" onSelect={() => router.push(`/jobs?${queryToParams(s.query).toString()}`)}>
                <span className="truncate">{s.name}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                aria-label={s.notify ? `Turn off daily alerts for ${s.name}` : `Turn on daily alerts for ${s.name}`}
                onSelect={(e) => {
                  e.preventDefault();
                  start(async () => {
                    await toggleSavedSearchNotify(s.id, !s.notify);
                    toast(s.notify ? "Daily alerts off" : "Daily alerts on");
                    router.refresh();
                  });
                }}
              >
                {s.notify ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
              </DropdownMenuItem>
              <DropdownMenuItem
                aria-label={`Delete ${s.name}`}
                onSelect={(e) => {
                  e.preventDefault();
                  start(async () => {
                    await deleteSavedSearch(s.id);
                    toast("Search deleted");
                    router.refresh();
                  });
                }}
              >
                <Trash2 className="size-4" aria-hidden />
              </DropdownMenuItem>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent title="Save search" description="Come back to these filters in one click.">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ss-name">Name</Label>
              <Input id="ss-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Remote React, India" aria-invalid={Boolean(error)} />
              {error ? <p className="text-small text-danger">{error}</p> : null}
            </div>
            <label className="flex items-center gap-2">
              <Checkbox checked={notify} onCheckedChange={(v) => setNotify(Boolean(v))} />
              Tell me about new matching jobs once a day
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="quiet" onClick={() => setDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={pending}>
                Save search
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
