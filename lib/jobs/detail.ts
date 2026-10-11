/** Split a description into "About the role" and "Requirements" at a requirements heading. */
export function splitDescription(text: string | null | undefined): { about: string | null; requirements: string | null } {
  if (!text) return { about: null, requirements: null };
  const re = /\n\s*(requirements|qualifications|what you(?:'|’)ll need|what we(?:'|’)re looking for|must[- ]haves?|skills required|who you are|you should have|desired profile)\s*:?\s*\n/i;
  const m = text.match(re);
  if (!m || m.index === undefined) return { about: text.trim(), requirements: null };
  return { about: text.slice(0, m.index).trim() || null, requirements: text.slice(m.index + m[0].length).trim() || null };
}

/** Pick the resume whose role type appears in the job title, else the default. */
export function pickResume<T extends { id: string; roleType: string | null; isDefault: boolean }>(resumes: T[], jobTitle: string): T | null {
  const title = jobTitle.toLowerCase();
  return (
    resumes.find((r) => r.roleType && title.includes(r.roleType.toLowerCase())) ??
    resumes.find((r) => r.isDefault) ??
    resumes[0] ??
    null
  );
}
