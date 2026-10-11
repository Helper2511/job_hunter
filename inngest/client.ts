import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "jobhunt-hub" });

export const EVENTS = {
  alertReceived: "email/alert.received",
  companyCheck: "company/check.requested",
  companyClassify: "company/classify.requested",
} as const;
