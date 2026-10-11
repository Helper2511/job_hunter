import type { Metadata } from "next";

export const metadata: Metadata = { title: "Jobs" };

export default function JobsIndex() {
  return (
    <div className="hidden h-full items-center justify-center p-8 text-center text-muted lg:flex">
      <p>Select a job to see the details. Use the Up and Down keys to move through the list.</p>
    </div>
  );
}
