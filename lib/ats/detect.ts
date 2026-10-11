import type { AtsType } from "./types";

export interface AtsMatch {
  type: AtsType;
  token: string;
}

const PATTERNS: { type: AtsType; re: RegExp }[] = [
  { type: "greenhouse", re: /boards-api\.greenhouse\.io\/v1\/boards\/([a-z0-9_-]+)/i },
  { type: "greenhouse", re: /(?:job-boards|boards)(?:\.eu)?\.greenhouse\.io\/embed\/job_board(?:\/js)?\?for=([a-z0-9_-]+)/i },
  { type: "greenhouse", re: /(?:job-boards|boards)(?:\.eu)?\.greenhouse\.io\/(?!embed\b)([a-z0-9_-]+)/i },
  { type: "lever", re: /api\.lever\.co\/v0\/postings\/([a-z0-9_.-]+)/i },
  { type: "lever", re: /jobs(?:\.eu)?\.lever\.co\/([a-z0-9_.-]+)/i },
  { type: "ashby", re: /api\.ashbyhq\.com\/posting-api\/job-board\/([a-z0-9_.%-]+)/i },
  { type: "ashby", re: /jobs\.ashbyhq\.com\/([a-z0-9_.%-]+)/i },
  { type: "smartrecruiters", re: /api\.smartrecruiters\.com\/v1\/companies\/([a-z0-9_-]+)/i },
  { type: "smartrecruiters", re: /(?:careers|jobs)\.smartrecruiters\.com\/([a-z0-9_-]+)/i },
  { type: "workable", re: /apply\.workable\.com\/(?:api\/v1\/widget\/accounts\/)?([a-z0-9_-]+)/i },
  { type: "recruitee", re: /\/\/([a-z0-9-]+)\.recruitee\.com/i },
];

const IGNORED_TOKENS = new Set(["embed", "api", "js", "v1", "j", "jobs", "careers", "www", "static", "assets"]);

/** Detect a known job board from a URL or a page's HTML. */
export function detectAts(text: string): AtsMatch | null {
  for (const { type, re } of PATTERNS) {
    const m = text.match(re);
    if (m && m[1] && !IGNORED_TOKENS.has(m[1].toLowerCase())) {
      return { type, token: decodeURIComponent(m[1]).replace(/[/?#].*$/, "") };
    }
  }
  return null;
}
