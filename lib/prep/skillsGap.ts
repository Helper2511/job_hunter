/** A compact skills dictionary used to compare a job description with a resume. */
const SKILLS: { name: string; re: RegExp; study: string }[] = [
  { name: "JavaScript", re: /\bjavascript\b|\bes6\b/i, study: "Closures, async/await, the event loop" },
  { name: "TypeScript", re: /\btypescript\b/i, study: "Generics, narrowing, utility types" },
  { name: "React", re: /\breact(\.js|js)?\b/i, study: "Hooks, rendering behaviour, state management" },
  { name: "Next.js", re: /\bnext\.?js\b/i, study: "App Router, server components, caching" },
  { name: "Angular", re: /\bangular\b/i, study: "Components, RxJS, change detection" },
  { name: "Vue", re: /\bvue(\.js|js)?\b/i, study: "Composition API, reactivity" },
  { name: "Node.js", re: /\bnode(\.js|js)?\b/i, study: "Streams, the event loop, Express or Fastify" },
  { name: "Python", re: /\bpython\b/i, study: "Data structures, typing, packaging" },
  { name: "Django", re: /\bdjango\b/i, study: "ORM, middleware, DRF" },
  { name: "FastAPI", re: /\bfastapi\b/i, study: "Dependency injection, Pydantic models" },
  { name: "Java", re: /\bjava\b(?!script)/i, study: "Collections, concurrency, JVM basics" },
  { name: "Spring Boot", re: /\bspring( boot)?\b/i, study: "Dependency injection, JPA, REST controllers" },
  { name: "Go", re: /\bgolang\b|\bgo (developer|engineer)\b/i, study: "Goroutines, channels, interfaces" },
  { name: "C#", re: /\bc#|\.net\b/i, study: "LINQ, async, ASP.NET Core" },
  { name: "SQL", re: /\bsql\b|\bpostgres(ql)?\b|\bmysql\b/i, study: "Joins, indexes, query plans" },
  { name: "MongoDB", re: /\bmongo(db)?\b/i, study: "Schema design, aggregation pipeline" },
  { name: "Redis", re: /\bredis\b/i, study: "Caching patterns, data types, expiry" },
  { name: "GraphQL", re: /\bgraphql\b/i, study: "Schemas, resolvers, N+1 problems" },
  { name: "REST APIs", re: /\brest(ful)?\b|\bapis?\b/i, study: "Resource design, status codes, pagination" },
  { name: "AWS", re: /\baws\b|amazon web services/i, study: "EC2, S3, IAM, Lambda" },
  { name: "GCP", re: /\bgcp\b|google cloud/i, study: "Compute, Cloud Run, IAM" },
  { name: "Azure", re: /\bazure\b/i, study: "App Service, Functions, AD" },
  { name: "Docker", re: /\bdocker\b|containers?/i, study: "Images, layers, compose" },
  { name: "Kubernetes", re: /\bkubernetes\b|\bk8s\b/i, study: "Pods, deployments, services" },
  { name: "CI/CD", re: /\bci\/?cd\b|github actions|jenkins|gitlab ci/i, study: "Pipelines, test stages, deployments" },
  { name: "Testing", re: /\bunit test|\btesting\b|jest|vitest|cypress|playwright|pytest|junit/i, study: "Unit vs integration tests, mocking" },
  { name: "System design", re: /system design|scalab|distributed systems|high availability/i, study: "Load balancing, caching, queues, consistency" },
  { name: "Data structures and algorithms", re: /data structures|algorithms|\bdsa\b|problem solving/i, study: "Arrays, hash maps, trees, graphs, complexity" },
  { name: "HTML and CSS", re: /\bhtml5?\b|\bcss3?\b|tailwind|sass/i, study: "Layout, responsive design, accessibility" },
  { name: "Accessibility", re: /accessibility|\bwcag\b|\ba11y\b/i, study: "WCAG basics, ARIA, keyboard support" },
  { name: "Microservices", re: /microservices?/i, study: "Service boundaries, messaging, observability" },
  { name: "Kafka", re: /\bkafka\b/i, study: "Topics, partitions, consumer groups" },
  { name: "Machine learning", re: /machine learning|\bml\b|deep learning/i, study: "Model evaluation, overfitting, feature engineering" },
  { name: "LLMs", re: /\bllms?\b|generative ai|\bgenai\b|prompt engineering|\brag\b/i, study: "Prompting, retrieval, evaluation" },
  { name: "Data analysis", re: /data analysis|pandas|excel|power bi|tableau/i, study: "Cleaning data, aggregation, charts" },
  { name: "Figma", re: /\bfigma\b/i, study: "Components, auto layout, prototyping" },
  { name: "Agile", re: /\bagile\b|\bscrum\b|\bjira\b/i, study: "Sprints, estimation, retrospectives" },
  { name: "Communication", re: /communication skills|stakeholder/i, study: "Clear updates, explaining trade-offs" },
  { name: "Leadership", re: /\bmentor|\bleadership\b|lead a team|team lead/i, study: "Mentoring, delegation, feedback" },
  { name: "Android", re: /\bandroid\b|\bkotlin\b/i, study: "Activity lifecycle, Jetpack" },
  { name: "iOS", re: /\bios\b|\bswift\b/i, study: "UIKit/SwiftUI, memory management" },
  { name: "React Native", re: /react native/i, study: "Bridges, navigation, performance" },
  { name: "Flutter", re: /\bflutter\b|\bdart\b/i, study: "Widgets, state management" },
  { name: "Linux", re: /\blinux\b|\bbash\b|shell scripting/i, study: "Processes, permissions, scripting" },
  { name: "Security", re: /\bsecurity\b|owasp|authentication|oauth/i, study: "OWASP top 10, auth flows" },
];

export function extractSkills(text: string): string[] {
  return SKILLS.filter((s) => s.re.test(text)).map((s) => s.name);
}

export interface SkillsGap {
  required: string[];
  missing: string[];
  studyList: string[];
}

/** Skills in the job description that do not appear in the resume, with a short study list. */
export function computeSkillsGap(jobDescription: string, resumeText: string | null): SkillsGap {
  const required = extractSkills(jobDescription);
  const have = new Set(resumeText ? extractSkills(resumeText) : []);
  // Without resume text nothing can be ruled out, so every required skill is listed to review.
  const missing = resumeText ? required.filter((s) => !have.has(s)) : required;
  const studyList = missing.map((m) => `${m}: ${SKILLS.find((s) => s.name === m)?.study ?? "review the basics"}`);
  return { required, missing, studyList };
}

/** Key responsibilities and must-haves pulled from bullet lines of a description. */
export function summarizeRole(description: string, maxLines = 6): string {
  const lines = description
    .split(/\n|•/)
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((l) => l.length > 25 && l.length < 220);
  const priority = lines.filter((l) => /\b(you will|responsib|build|own|design|develop|lead|work with|must|required|experience (with|in))\b/i.test(l));
  const chosen = (priority.length >= 3 ? priority : lines).slice(0, maxLines);
  return chosen.map((l) => `• ${l}`).join("\n");
}
