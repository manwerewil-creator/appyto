import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service · Feasters",
  description: "The terms that govern your use of Feasters.",
};

const UPDATED = "29 June 2026";
const CONTACT = "support@feasters.cloud"; // ← keep in sync with the privacy page

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function Terms() {
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {UPDATED}</p>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          These terms govern your use of Feasters (www.feasters.cloud). By using Feasters, you agree to them.
        </p>

        <Section title="What Feasters does">
          <p>
            Feasters helps you find jobs that match your profile and, at your direction, sends tailored
            applications to employers from your own email account. Feasters is a tool to help you apply
            faster. It is not a recruitment agency and does not guarantee interviews, offers, or employment.
          </p>
        </Section>

        <Section title="Your account and responsibilities">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>You are responsible for the accuracy of the profile, CV, and information you provide.</li>
            <li>You authorise Feasters to send applications on your behalf to the employers and within the limits you choose.</li>
            <li>You agree to use Feasters lawfully and not to send misleading, abusive, or spam content.</li>
            <li>You are responsible for keeping your account secure.</li>
          </ul>
        </Section>

        <Section title="Email sending">
          <p>
            When you connect your email, you grant Feasters permission to send job-application emails from
            your account. You can disconnect at any time. You remain responsible for the applications sent
            from your account.
          </p>
        </Section>

        <Section title="Plans and payments">
          <p>
            Some features require a paid plan. Prices and what each plan includes are shown in the app.
            Payments are processed by our payment provider.
          </p>
        </Section>

        <Section title="Disclaimer and liability">
          <p>
            Feasters is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee any
            particular outcome from using the service. To the extent permitted by law, Feasters is not liable
            for any indirect or consequential loss arising from your use of the service.
          </p>
        </Section>

        <Section title="Changes and termination">
          <p>
            We may update these terms or the service over time. You may stop using Feasters at any time, and
            we may suspend accounts that violate these terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions? Email{" "}
            <a href={`mailto:${CONTACT}`} className="font-medium text-primary hover:underline">{CONTACT}</a>.
          </p>
        </Section>

        <footer className="border-t pt-6 text-xs text-muted-foreground">
          <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>
          <span className="mx-2">·</span>
          <span>© {UPDATED.slice(-4)} Feasters</span>
        </footer>
      </main>
    </div>
  );
}
