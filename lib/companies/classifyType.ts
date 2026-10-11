import { z } from "zod";
import type { CompanyType } from "@/lib/providers/types";

export type ClassifiedType = CompanyType | "unknown";

export interface Classification {
  type: ClassifiedType;
  source: "rule" | "llm" | null;
  reason: string | null;
  industry: string | null;
  confidence?: number;
}

const SIGNALS: Record<CompanyType, { re: RegExp; label: string; weight: number }[]> = {
  saas: [
    { re: /\bsaas\b|software[- ]as[- ]a[- ]service/gi, label: "says SaaS", weight: 3 },
    { re: /\bfree trial\b|start (your )?free|try (it )?for free/gi, label: "offers a free trial", weight: 2 },
    { re: /\bbook a demo\b|request a demo|get a demo|schedule a demo/gi, label: "offers demos", weight: 2 },
    { re: /\bpricing\b|per (user|seat)\s*\/?\s*(per )?month|\/mo\b/gi, label: "has a pricing page", weight: 1 },
    { re: /\b(cloud|subscription) platform\b|\bplatform\b/gi, label: "sells a platform", weight: 1 },
  ],
  product: [
    { re: /\bour products?\b/gi, label: "lists its products", weight: 2 },
    { re: /\b(app store|google play|download the app)\b/gi, label: "has an app", weight: 2 },
    { re: /\bshop now\b|\badd to cart\b|\bbuy now\b/gi, label: "sells to customers", weight: 2 },
    { re: /\bconsumer\b|\bd2c\b|direct[- ]to[- ]consumer/gi, label: "consumer brand", weight: 1 },
  ],
  services: [
    { re: /\bour clients\b|\bclient(s)? (we|across)\b/gi, label: "talks about clients", weight: 2 },
    { re: /\b(it services|consulting|consultancy|outsourcing|staff augmentation|offshore)\b/gi, label: "offers consulting or IT services", weight: 3 },
    { re: /\bcase stud(y|ies)\b/gi, label: "publishes case studies", weight: 1 },
    { re: /\b(digital agency|creative agency|our services|what we do for)\b/gi, label: "is an agency", weight: 2 },
  ],
  manufacturing: [
    { re: /\bmanufactur(ing|er|ers)\b/gi, label: "manufactures goods", weight: 3 },
    { re: /\b(plant|plants|factory|factories)\b/gi, label: "runs plants", weight: 2 },
    { re: /\bproduction capacity\b|\btonnes?\b|\bassembly line/gi, label: "states production capacity", weight: 2 },
    { re: /\b(oem|auto components?|auto parts)\b/gi, label: "makes components", weight: 2 },
  ],
  other: [
    { re: /\b(bank|banking|nbfc|insurance)\b/gi, label: "financial institution", weight: 2 },
    { re: /\b(hospital|clinic|patients)\b/gi, label: "healthcare provider", weight: 2 },
    { re: /\b(university|school|college|admissions)\b/gi, label: "education", weight: 2 },
    { re: /\b(government|ministry|municipal)\b/gi, label: "government", weight: 2 },
    { re: /\b(retail stores?|supermarket|outlets)\b/gi, label: "retail", weight: 2 },
  ],
};

const INDUSTRIES: { re: RegExp; label: string }[] = [
  { re: /\b(payments?|fintech|lending|neobank|wealth|trading)\b/i, label: "Fintech" },
  { re: /\b(edtech|learning platform|courses|students)\b/i, label: "Edtech" },
  { re: /\b(healthtech|healthcare|patients|clinical)\b/i, label: "Healthcare" },
  { re: /\b(e-?commerce|marketplace|online store)\b/i, label: "E-commerce" },
  { re: /\b(logistics|supply chain|shipping|freight)\b/i, label: "Logistics" },
  { re: /\b(auto parts|automotive|vehicles?|ev\b)/i, label: "Automotive" },
  { re: /\b(cybersecurity|security platform|threat)\b/i, label: "Security" },
  { re: /\b(hr software|payroll|recruiting software|hrms)\b/i, label: "HR tech" },
  { re: /\b(developer tools|devops|api platform|observability)\b/i, label: "Developer tools" },
  { re: /\b(analytics|data platform|business intelligence)\b/i, label: "Data and analytics" },
  { re: /\b(gaming|games)\b/i, label: "Gaming" },
  { re: /\b(pharma|pharmaceutical|drugs)\b/i, label: "Pharma" },
  { re: /\b(textiles?|apparel|garments?)\b/i, label: "Textiles" },
  { re: /\b(food|restaurants?|delivery)\b/i, label: "Food" },
];

export function guessIndustry(text: string): string | null {
  return INDUSTRIES.find((i) => i.re.test(text))?.label ?? null;
}

/** Step 1: rules. Accept only when one type clearly leads. */
export function classifyByRules(text: string): Classification {
  const scores: { type: CompanyType; score: number; labels: string[] }[] = [];
  for (const [type, signals] of Object.entries(SIGNALS) as [CompanyType, (typeof SIGNALS)[CompanyType]][]) {
    let score = 0;
    const labels: string[] = [];
    for (const s of signals) {
      const hits = Math.min((text.match(s.re) ?? []).length, 3);
      if (hits) {
        score += s.weight * (1 + (hits - 1) * 0.25);
        labels.push(s.label);
      }
    }
    scores.push({ type, score, labels });
  }
  scores.sort((a, b) => b.score - a.score);
  const [top, second] = scores;
  const industry = guessIndustry(text);
  if (top.score >= 4 && top.score >= second.score * 2) {
    return {
      type: top.type,
      source: "rule",
      reason: `Website ${top.labels.slice(0, 2).join(" and ")}`,
      industry,
    };
  }
  return { type: "unknown", source: null, reason: null, industry };
}

export const llmClassificationSchema = z.object({
  type: z.enum(["saas", "product", "services", "manufacturing", "other"]),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(160),
  industry: z.string().max(40).nullable(),
});

export const CLASSIFY_SYSTEM = `You classify companies by their main business.
Types:
- saas: sells its own software as a subscription service
- product: builds and sells its own product that is not subscription software (apps, devices, consumer brands)
- services: builds or runs things for clients (IT services, consulting, agencies, outsourcing)
- manufacturing: makes physical goods in its own plants or factories
- other: banks, hospitals, education, retail, government and anything else
A company that does several things gets the type of its main business.
Return a one-line reason a job seeker would understand, and a short industry label such as "Fintech" or "Auto parts".`;

/** Step 2: accept an LLM answer only at confidence 0.7 or higher. */
export function acceptLlmClassification(result: z.infer<typeof llmClassificationSchema>): Classification {
  if (result.confidence >= 0.7) {
    return { type: result.type, source: "llm", reason: result.reason, industry: result.industry, confidence: result.confidence };
  }
  return { type: "unknown", source: null, reason: null, industry: result.industry, confidence: result.confidence };
}
