import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import type { CompanyType, WorkMode } from "@/lib/providers/types";
import { getGoogleAccount, hasGmailSend, requireUser } from "@/lib/session";
import { newAlertAddress } from "@/lib/auth";

export const metadata: Metadata = { title: "Get started" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const { step } = await searchParams;
  let user = await requireUser();
  if (!user.alertAddress) user = await db.user.update({ where: { id: user.id }, data: { alertAddress: newAlertAddress() } });
  const [resumeCount, google] = await Promise.all([db.resume.count({ where: { userId: user.id } }), getGoogleAccount(user.id)]);
  const requested = Number(step);
  const initialStep = Number.isInteger(requested) && requested >= 1 && requested <= 4 ? requested - 1 : 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <h1 className="text-page font-semibold">Set up JobHunt</h1>
      <p className="mb-6 text-muted">Two minutes now saves hours later. Steps 3 and 4 can wait.</p>
      <OnboardingFlow
        initialStep={initialStep}
        hasResume={resumeCount > 0}
        storageReady={features.storage}
        preferences={{
          roles: user.roles,
          workModes: user.workModes as WorkMode[],
          locations: user.locations,
          companyTypes: user.companyTypes as CompanyType[],
        }}
        alertAddress={user.alertAddress!}
        gmail={{ connected: hasGmailSend(google?.scope), address: user.gmailAddress, configured: features.google }}
      />
    </main>
  );
}
