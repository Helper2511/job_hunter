import type { Metadata } from "next";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { ForwardingSetup } from "@/components/settings/forwarding-setup";
import { GmailConnect } from "@/components/settings/gmail-connect";
import { DeleteMyData, NotificationsForm, ThemeSelect } from "@/components/settings/misc";
import { ProfileForm } from "@/components/settings/profile-form";
import { ResumesSection } from "@/components/settings/resumes-section";
import { db } from "@/lib/db";
import { features } from "@/lib/env";
import type { CompanyType, WorkMode } from "@/lib/providers/types";
import { hasGmailSend, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

function Section({ id, title, children, description }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-4 border-t border-border py-8 first:border-0 first:pt-0">
      <h2 id={`${id}-title`} className="text-section font-semibold">
        {title}
      </h2>
      {description ? <p className="mb-4 text-muted">{description}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}

function ConnectionRow({ name, status, children }: { name: string; status: "Connected" | "Not set up" | "Needs attention"; children?: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-2 border-b border-border py-4 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{name}</span>
        <span className={status === "Connected" ? "text-accent" : status === "Needs attention" ? "text-danger" : "text-muted"}>{status}</span>
      </div>
      {children}
    </li>
  );
}

function olderThanDays(date: Date, days: number): boolean {
  return Date.now() - date.getTime() > days * 86_400_000;
}

export default async function SettingsPage() {
  const user = await requireUser();
  const [resumes, accounts, lastAlert] = await Promise.all([
    db.resume.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.account.findMany({ where: { userId: user.id }, select: { providerId: true, scope: true } }),
    db.inboundEmail.findFirst({ where: { userId: user.id, kind: "alert" }, orderBy: { receivedAt: "desc" } }),
  ]);
  const linkedin = accounts.some((a) => a.providerId === "linkedin");
  const google = accounts.find((a) => a.providerId === "google");
  const gmailOk = hasGmailSend(google?.scope);
  const staleAlerts = lastAlert ? olderThanDays(lastAlert.receivedAt, 14) : false;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
      <h1 className="mb-6 text-page font-semibold">Settings</h1>

      <Section id="profile" title="Profile" description="Used for copy-ready answers when you apply.">
        <ProfileForm
          initial={{
            name: user.name,
            phone: user.phone ?? "",
            noticePeriod: user.noticePeriod ?? "",
            linkedinUrl: user.linkedinUrl ?? "",
            naukriUrl: user.naukriUrl ?? "",
            glassdoorUrl: user.glassdoorUrl ?? "",
            savedSearchUrls: user.savedSearchUrls,
          }}
        />
      </Section>

      <Section id="resumes" title="Resumes" description="Keep a version per role type. The matching one is picked when you apply.">
        <ResumesSection
          storageReady={features.storage}
          resumes={resumes.map((r) => ({
            id: r.id,
            label: r.label,
            fileName: r.fileName,
            roleType: r.roleType,
            isDefault: r.isDefault,
            createdAt: r.createdAt.toISOString(),
            hasText: Boolean(r.textContent),
          }))}
        />
      </Section>

      <Section id="preferences" title="Preferences" description="Your default search filters.">
        <PreferencesForm
          initial={{
            roles: user.roles,
            workModes: user.workModes as WorkMode[],
            locations: user.locations,
            companyTypes: user.companyTypes as CompanyType[],
          }}
        />
        <div className="mt-6">
          <ThemeSelect />
        </div>
      </Section>

      <Section id="connections" title="Connections">
        <ul>
          <ConnectionRow name="LinkedIn sign-in" status={linkedin ? "Connected" : "Not set up"}>
            <p className="text-small text-muted">Name, email and photo only. Platform jobs reach JobHunt through your forwarded alerts.</p>
          </ConnectionRow>
          <ConnectionRow name="Gmail for sending" status={gmailOk ? "Connected" : google ? "Needs attention" : "Not set up"}>
            <GmailConnect connected={gmailOk} address={user.gmailAddress} configured={features.google} callbackURL="/settings#connections" />
          </ConnectionRow>
          <ConnectionRow name="Job alert forwarding" status={!lastAlert ? "Not set up" : staleAlerts ? "Needs attention" : "Connected"}>
            {staleAlerts ? <p className="text-small text-danger">No alert emails for two weeks. Check that your forwarding filter is still on.</p> : null}
            {user.alertAddress ? <ForwardingSetup address={user.alertAddress} poll={!lastAlert} /> : null}
          </ConnectionRow>
          <ConnectionRow name="Naukri" status={user.naukriUrl ? "Connected" : "Not set up"}>
            <p className="text-small text-muted">Add your profile link under Profile. Naukri has no sign-in for other apps.</p>
          </ConnectionRow>
          <ConnectionRow name="Glassdoor" status={user.glassdoorUrl ? "Connected" : "Not set up"}>
            <p className="text-small text-muted">Add your profile link under Profile.</p>
          </ConnectionRow>
        </ul>
      </Section>

      <Section id="notifications" title="Notifications and limits">
        <NotificationsForm notifyByEmail={user.notifyByEmail} dailyEmailLimit={user.dailyEmailLimit} />
      </Section>

      <Section id="data" title="Data" description="Forwarded emails are deleted after 7 days. Your passwords for job sites are never asked for or stored.">
        <DeleteMyData />
      </Section>
    </div>
  );
}
