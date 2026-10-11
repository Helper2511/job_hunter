/** Minimal robots.txt support: the Disallow rules that apply to our bot (or "*"). */
export function parseRobots(txt: string, botName = "jobhunthubbot"): string[] {
  const groups: { agents: string[]; disallow: string[] }[] = [];
  let current: { agents: string[]; disallow: string[] } | null = null;
  let lastWasAgent = false;
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (key === "disallow" && current && value) current.disallow.push(value);
    }
  }
  const own = groups.filter((g) => g.agents.some((a) => a !== "*" && botName.includes(a)));
  const chosen = own.length ? own : groups.filter((g) => g.agents.includes("*"));
  return chosen.flatMap((g) => g.disallow);
}

export function isPathAllowed(path: string, disallow: string[]): boolean {
  return !disallow.some((rule) => {
    if (rule.includes("*") || rule.endsWith("$")) {
      const re = new RegExp(
        "^" + rule.replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"),
      );
      return re.test(path);
    }
    return path.startsWith(rule);
  });
}
