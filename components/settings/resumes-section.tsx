"use client";

import { useRouter } from "next/navigation";
import { ResumeList, type ResumeRow } from "./resume-list";
import { ResumeUploader } from "./resume-uploader";

export function ResumesSection({ resumes, storageReady }: { resumes: ResumeRow[]; storageReady: boolean }) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-4">
      <ResumeList resumes={resumes} />
      {storageReady ? (
        <ResumeUploader onUploaded={() => router.refresh()} />
      ) : (
        <p className="text-small text-muted">Resume storage is not configured on this server yet.</p>
      )}
    </div>
  );
}
