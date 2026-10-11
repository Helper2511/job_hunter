import { z } from "zod";

const url = z.union([z.literal(""), z.string().trim().url("Enter a full web address, starting with https://").max(300)]);

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  phone: z.string().trim().max(30),
  noticePeriod: z.string().trim().max(60),
  linkedinUrl: url,
  naukriUrl: url,
  glassdoorUrl: url,
  savedSearchUrls: z.array(z.string().trim().url()).max(10),
});

export const preferencesSchema = z.object({
  roles: z.array(z.string().trim().min(1).max(60)).max(10),
  workModes: z.array(z.enum(["remote", "hybrid", "onsite"])),
  locations: z.array(z.string().trim().min(1).max(80)).max(10),
  companyTypes: z.array(z.enum(["saas", "product", "services", "manufacturing", "other"])),
});

