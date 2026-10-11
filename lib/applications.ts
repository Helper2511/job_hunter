import { daysSince, formatDate } from "@/lib/utils";

export interface TrackerCard {
  id: string;
  jobId: string;
  status: string;
  title: string;
  company: string;
  appliedAt: string;
  followUpAt: string | null;
  interviewAt: string | null;
  hasPrep: boolean;
}

/** The one next step shown on a tracker card. */
export function nextAction(card: TrackerCard, now = new Date()): string | null {
  switch (card.status) {
    case "SAVED":
      return "Apply when ready";
    case "APPLIED": {
      if (!card.followUpAt) return null;
      const due = new Date(card.followUpAt);
      const days = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
      if (days <= 0) return "Follow up today";
      return `Follow up in ${days} day${days === 1 ? "" : "s"}`;
    }
    case "INTERVIEW":
      return card.interviewAt ? `Interview ${formatDate(card.interviewAt)}` : "Set the interview date";
    case "OFFER":
      return "Reply to the offer";
    default:
      return null;
  }
}

export function ageLabel(card: TrackerCard, now = new Date()): string {
  const d = daysSince(card.appliedAt, now);
  const verb = card.status === "SAVED" ? "Saved" : "Applied";
  return d === 0 ? `${verb} today` : `${verb} ${d} day${d === 1 ? "" : "s"} ago`;
}
