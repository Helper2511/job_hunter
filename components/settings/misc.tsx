"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";
import { deleteMyData, updateNotifications } from "@/app/actions/settings";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { signOut } from "@/lib/auth-client";

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  // The stored theme is only known in the browser.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="theme">Theme</Label>
      <NativeSelect id="theme" className="max-w-xs" value={mounted ? theme : "system"} onChange={(e) => setTheme(e.target.value)}>
        <option value="system">Follow my device</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </NativeSelect>
    </div>
  );
}

export function NotificationsForm({ notifyByEmail, dailyEmailLimit }: { notifyByEmail: boolean; dailyEmailLimit: number }) {
  const [notify, setNotify] = useState(notifyByEmail);
  const [limit, setLimit] = useState(dailyEmailLimit);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await updateNotifications({ notifyByEmail: notify, dailyEmailLimit: limit });
          toast.success("Saved");
        });
      }}
    >
      <label className="flex min-h-11 items-center justify-between gap-3">
        <span>
          Email me about new matches and interview reminders
          <span className="block text-small text-muted">You always see them in Updates too.</span>
        </span>
        <Switch checked={notify} onCheckedChange={setNotify} />
      </label>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="limit">Most resumes to email in a day</Label>
        <Input id="limit" type="number" min={1} max={20} className="max-w-32" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
        <p className="text-small text-muted">Up to 20, one per company per role, so your emails do not look like spam.</p>
      </div>
      <Button type="submit" variant="secondary" disabled={pending} className="self-start">
        Save notifications
      </Button>
    </form>
  );
}

export function DeleteMyData() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete my data</Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        title="Delete all your data?"
        description="This removes your account, resumes, connected accounts, applications and prep notes. It cannot be undone."
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await deleteMyData(confirm);
              if ("error" in res && res.error) {
                setError(res.error);
                return;
              }
              await signOut().catch(() => undefined);
              router.push("/");
            });
          }}
        >
          <Label htmlFor="confirm-delete">Type DELETE to confirm</Label>
          <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
          {error ? <p className="text-small text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructiveFill" disabled={confirm !== "DELETE" || pending}>
              {pending ? "Deleting…" : "Delete everything"}
            </Button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
