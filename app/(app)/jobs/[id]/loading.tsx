import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8" aria-busy="true" aria-label="Loading job">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/3" />
      <Skeleton className="mt-1 h-4 w-1/2" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="mt-8 h-40 w-full" />
    </div>
  );
}
