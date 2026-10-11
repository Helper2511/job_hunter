"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeOnboarding } from "@/app/actions/settings";
import { ForwardingSetup } from "@/components/settings/forwarding-setup";
import { GmailConnect } from "@/components/settings/gmail-connect";
import { PreferencesForm, type Preferences } from "@/components/settings/preferences-form";
import { ResumeUploader } from "@/components/settings/resume-uploader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const STEPS = ["Resume", "What you want", "Job alert forwarding", "Gmail for sending"];

interface Props {
  initialStep: number;
  hasResume: boolean;
  storageReady: boolean;
  preferences: Preferences;
  alertAddress: string;
  gmail: { connected: boolean; address: string | null; configured: boolean };
}

export function OnboardingFlow({ initialStep, hasResume, storageReady, preferences, alertAddress, gmail }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [uploaded, setUploaded] = useState(hasResume);
  const [pending, start] = useTransition();

  const finish = () =>
    start(async () => {
      await completeOnboarding();
      router.push("/jobs");
    });

  return (
    <div>
      <p className="text-small text-muted">
        Step {step + 1} of {STEPS.length}
      </p>
      <Progress value={((step + 1) / STEPS.length) * 100} label={`Step ${step + 1} of ${STEPS.length}`} className="mt-2" />
      <ol className="mt-3 hidden gap-4 text-small sm:flex">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? "font-medium text-foreground" : "text-muted"} aria-current={i === step ? "step" : undefined}>
            {i < step ? <Check className="mr-1 inline size-3.5 text-accent" aria-hidden /> : null}
            {s}
          </li>
        ))}
      </ol>

      <section className="mt-8" aria-labelledby="step-title">
        <h2 id="step-title" className="text-section font-semibold">
          {STEPS[step]}
        </h2>

        {step === 0 ? (
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-muted">Upload your resume as a PDF. You can add more versions later, for example one per role type.</p>
            {uploaded ? (
              <p className="flex items-center gap-2 font-medium">
                <Check className="size-4 text-accent" aria-hidden /> Resume uploaded.
              </p>
            ) : null}
            {storageReady ? (
              <ResumeUploader compact onUploaded={() => setUploaded(true)} />
            ) : (
              <p className="text-small text-muted">Resume storage is not configured on this server yet. You can upload later in Settings.</p>
            )}
            <div className="flex gap-2">
              <Button variant={uploaded ? "primary" : "quiet"} onClick={() => setStep(1)}>
                {uploaded ? "Continue" : "Skip for now"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-4">
            <p className="mb-4 text-muted">These become your default filters. You can change them on every search.</p>
            <PreferencesForm initial={preferences} submitLabel="Save and continue" finishOnboarding onSaved={() => setStep(2)} />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-4 flex flex-col gap-6">
            <p className="text-muted">
              Forward the job alert emails you already get from LinkedIn, Naukri and Glassdoor. JobHunt turns them into jobs and
              compares them with company career pages.
            </p>
            <ForwardingSetup address={alertAddress} />
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setStep(3)}>
                Continue
              </Button>
              <Button variant="quiet" onClick={() => setStep(3)}>
                Skip, finish later in Settings
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-4 flex flex-col gap-6">
            <GmailConnect connected={gmail.connected} address={gmail.address} configured={gmail.configured} callbackURL="/onboarding?step=4" />
            <div className="flex gap-2">
              <Button variant="primary" onClick={finish} disabled={pending}>
                Go to jobs
              </Button>
              {!gmail.connected ? (
                <Button variant="quiet" onClick={finish} disabled={pending}>
                  Skip, finish later in Settings
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      {step > 0 ? (
        <Button variant="quiet" className="mt-8" onClick={() => setStep(step - 1)}>
          Back
        </Button>
      ) : null}
    </div>
  );
}
