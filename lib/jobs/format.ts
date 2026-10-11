/** "Remote (India)", "Pune", "Bengaluru +2", or the raw location text. */
export function placeLabel(job: { workMode: string; cities: string[]; location: string | null; remoteScope: string | null }): string {
  if (job.workMode === "remote") {
    return job.remoteScope === "india" ? "Remote (India)" : job.remoteScope === "worldwide" ? "Remote (worldwide)" : "Remote";
  }
  if (job.cities.length > 2) return `${job.cities[0]} +${job.cities.length - 1}`;
  if (job.cities.length) return job.cities.join(", ");
  return job.location ?? "Location not stated";
}
