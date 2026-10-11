"use client";

import { Bookmark, BookmarkCheck, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { hideJob, saveJob, unhideJob, unsaveJob } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";

export function JobActions({ jobId, saved, hidden }: { jobId: string; saved: boolean; hidden: boolean }) {
  const router = useRouter();
  const [isSaved, setSaved] = useState(saved);
  const [pending, start] = useTransition();

  return (
    <>
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (isSaved) {
              await unsaveJob(jobId);
              setSaved(false);
              toast("Removed from saved");
            } else {
              await saveJob(jobId);
              setSaved(true);
              toast.success("Saved to your tracker");
            }
            router.refresh();
          })
        }
      >
        {isSaved ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
        {isSaved ? "Saved" : "Save"}
      </Button>
      <Button
        variant="quiet"
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (hidden) {
              await unhideJob(jobId);
              toast("Job shown again");
            } else {
              await hideJob(jobId);
              toast("Hidden from your results", {
                action: { label: "Undo", onClick: () => unhideJob(jobId).then(() => router.refresh()) },
              });
            }
            router.refresh();
          })
        }
      >
        <EyeOff aria-hidden />
        {hidden ? "Show in results" : "Not interested"}
      </Button>
    </>
  );
}
