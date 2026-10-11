import { checkOneCompany, classifyCompanies, dailyCareerPageCheck } from "./checkCareerPages";
import { parseAlertEmail, purgeInboundEmails } from "./parseAlertEmail";
import { sendReminders } from "./sendReminders";

export const functions = [
  dailyCareerPageCheck,
  checkOneCompany,
  classifyCompanies,
  parseAlertEmail,
  purgeInboundEmails,
  sendReminders,
];

export { inngest, EVENTS } from "./client";
