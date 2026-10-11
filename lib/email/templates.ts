export interface CoverNoteInput {
  name: string;
  jobTitle: string;
  company: string;
  phone?: string | null;
  linkedinUrl?: string | null;
  highlights?: string[];
}

export function defaultSubject(jobTitle: string, name: string): string {
  return `Application for ${jobTitle} – ${name}`;
}

/** A plain cover note used when no LLM key is set; always editable before sending. */
export function defaultCoverNote(i: CoverNoteInput): string {
  const highlights = i.highlights?.length ? `\n\nA few things that match the role:\n${i.highlights.map((h) => `• ${h}`).join("\n")}` : "";
  const contact = [i.phone, i.linkedinUrl].filter(Boolean).join(" · ");
  return `Hello ${i.company} hiring team,

I came across the ${i.jobTitle} opening and would like to apply. My resume is attached.${highlights}

I would be glad to talk about how I can help the team. Thank you for your time.

Regards,
${i.name}${contact ? `\n${contact}` : ""}`;
}

export function notificationEmail(title: string, lines: string[], url: string): { subject: string; text: string } {
  return {
    subject: title,
    text: `${lines.join("\n")}\n\nOpen JobHunt Hub: ${url}\n\nYou can change notifications in Settings.`,
  };
}
