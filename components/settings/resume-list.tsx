"use client";

import { Download, FileText, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteResume, setDefaultResume } from "@/app/actions/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { relativeDate } from "@/lib/utils";

export interface ResumeRow {
  id: string;
  label: string;
  fileName: string;
  roleType: string | null;
  isDefault: boolean;
  createdAt: string;
  hasText: boolean;
}

export function ResumeList({ resumes }: { resumes: ResumeRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (!resumes.length) return <p className="text-muted">No resumes yet. Upload one below.</p>;
  return (
    <ul className="flex flex-col divide-y divide-border rounded-[8px] border border-border">
      {resumes.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-3 p-3">
          <FileText className="size-5 text-muted" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 font-medium">
              {r.label} {r.isDefault ? <Badge>Default</Badge> : null}
            </p>
            <p className="truncate text-small text-muted">
              {r.fileName} · added {relativeDate(r.createdAt)}
              {r.roleType ? ` · used for “${r.roleType}” roles` : ""}
              {!r.hasText ? " · text not readable" : ""}
            </p>
          </div>
          <div className="flex gap-1">
            <Button asChild variant="quiet" size="icon" aria-label={`Download ${r.label}`}>
              <a href={`/api/resumes/${r.id}/download`}>
                <Download aria-hidden />
              </a>
            </Button>
            {!r.isDefault ? (
              <Button
                variant="quiet"
                size="icon"
                aria-label={`Make ${r.label} the default`}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await setDefaultResume(r.id);
                    toast("Default resume changed");
                    router.refresh();
                  })
                }
              >
                <Star aria-hidden />
              </Button>
            ) : null}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="quiet" size="icon" aria-label={`Delete ${r.label}`}>
                  <Trash2 aria-hidden />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent title="Delete resume?" description={`“${r.label}” will be removed from storage. Past applications keep their record.`}>
                <div className="flex justify-end gap-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: "destructiveFill" })}
                    onClick={() =>
                      start(async () => {
                        await deleteResume(r.id);
                        toast("Resume deleted");
                        router.refresh();
                      })
                    }
                  >
                    Delete resume
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </li>
      ))}
    </ul>
  );
}
