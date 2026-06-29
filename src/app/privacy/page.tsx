import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Feasters",
  description: "How Feasters collects, uses, and protects your information, including Google account data.",
};

// Public, standalone legal page (no app shell, reachable logged-out). Required
// for Google OAuth verification — it must be live at https://www.feasters.cloud/privacy
// and contain the Google API Services "Limited Use" disclosure below.
const UPDATED = "29 June 2026";
const CONTACT = "support@feasters.cloud"; // ← make sure this inbox is monitored, or change it

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-tight text-foreground">Feasters</Link>
          <Link href="/welcome" className="text-sm font-medium text-primary hover:underline">Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {UPDATED}</p>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Feasters (&ldquo;Feasters&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a tool that helps job
          seekers in Zimbabwe apply to jobs faster. We help you find roles that match your profile and, when
          you choose, send a tailored application to the employer from your own email account. This policy
          explains what information we collect, how we use it, and the choices you have. It applies to
          www.feasters.cloud and the Feasters application.
        </p>

        <Section title="Information we collect">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><span className="font-medium text-foreground">Account details.</span> When you sign in with Google or email, we receive your name, email address, and profile photo.</li>
            <li><span className="font-medium text-foreground">Profile you provide.</span> Your qualifications, desired roles, locations, keywords, CV, and any extra links or documents you add for applications.</li>
            <li><span className="font-medium text-foreground">Email sending permission.</span> If you connect your Gmail, we receive an OAuth token that lets us send email on your behalf (see the Google section below).</li>
            <li><span className="font-medium text-foreground">Usage data.</span> Basic analytics such as pages visited and applications sent, used to operate and improve the service.</li>
          </ul>
        </Section>

        <Section title="How we use your information">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>To match you with relevant job listings.</li>
            <li>To draft and send job applications to employers when you ask us to (or, if you enable auto-apply, on your behalf within the limit you set).</li>
            <li>To maintain your account, provide support, and improve the service.</li>
          </ul>
        </Section>

        <Section title="Google account data and Gmail access">
          <p>
            If you connect your Gmail, Feasters requests the{" "}
            <span className="font-medium text-foreground">https://www.googleapis.com/auth/gmail.send</span>{" "}
            permission. We use it for a single purpose: to send the job-application emails you initiate, from
            your own Gmail, so that employers reply directly to you.
          </p>
          <p className="font-medium text-foreground">What we do NOT do:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>We do not read, search, download, or store the contents of your mailbox.</li>
            <li>We do not modify or delete any of your emails.</li>
            <li>We do not use your Google data for advertising, and we never sell it.</li>
            <li>We do not use your Google data to train any AI or machine-learning models.</li>
          </ul>
          <p>
            We store only an encrypted OAuth refresh token so we can send on your behalf. You can disconnect
            your Gmail at any time from Settings, or revoke access directly in your{" "}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">Google Account permissions</a>.
            Once disconnected, the token is removed and we can no longer send on your behalf.
          </p>
        </Section>

        <Section title="Limited Use disclosure">
          <p>
            Feasters&rsquo; use and transfer of information received from Google APIs to any other app will
            adhere to the{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">Google API Services User Data Policy</a>,
            including the Limited Use requirements.
          </p>
        </Section>

        <Section title="How we share information">
          <p>
            We do not sell your personal information. The job-application emails you send go to the employers
            you choose to apply to. We use a small number of service providers to run Feasters (for example,
            our hosting and database providers), who process data only on our instructions. We may disclose
            information if required by law.
          </p>
        </Section>

        <Section title="How we protect your data">
          <p>
            Sensitive credentials, including your Gmail OAuth token, are encrypted at rest. Access is
            restricted, and data is transmitted over secure connections (HTTPS).
          </p>
        </Section>

        <Section title="Data retention and your choices">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>You can disconnect your Gmail at any time, which deletes the stored sending token.</li>
            <li>You can edit or remove your profile, CV, and documents from within the app.</li>
            <li>You can request deletion of your account and associated data by contacting us at the address below.</li>
          </ul>
        </Section>

        <Section title="Children">
          <p>Feasters is intended for adults seeking employment and is not directed at children under 16.</p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy from time to time. When we do, we will revise the &ldquo;Last
            updated&rdquo; date above. Significant changes will be communicated within the app.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            Questions about this policy or your data? Email us at{" "}
            <a href={`mailto:${CONTACT}`} className="font-medium text-primary hover:underline">{CONTACT}</a>.
          </p>
        </Section>

        <footer className="border-t pt-6 text-xs text-muted-foreground">
          <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>
          <span className="mx-2">·</span>
          <span>© {UPDATED.slice(-4)} Feasters</span>
        </footer>
      </main>
    </div>
  );
}
