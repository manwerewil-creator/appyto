"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Select, Spinner, cn } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";
import type { Role } from "@/lib/vb/types";

type RoleTab = "student" | "company" | "university";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Feasters" width={32} height={32} className="rounded-lg" />
      <span className="text-[17px] font-extrabold tracking-tightest text-ink">Feasters</span>
    </Link>
  );
}

const ROLE_OPTIONS: { key: RoleTab; label: string; icon: "cap" | "building" | "chart" }[] = [
  { key: "student", label: "Student", icon: "cap" },
  { key: "company", label: "Company", icon: "building" },
  { key: "university", label: "University", icon: "chart" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleTab>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("Midlands State University");
  const [program, setProgram] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companySector, setCompanySector] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    const signUpMeta: Record<string, string> = { role };
    if (role === "student") signUpMeta.full_name = fullName;
    if (role === "company") {
      signUpMeta.full_name = companyName;
      signUpMeta.company_name = companyName;
    }
    if (role === "university") {
      signUpMeta.full_name = fullName;
      signUpMeta.company_name = companyName;
    }

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: signUpMeta },
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setLoading(false);
      return;
    }

    let user = data.user;
    if (!data.session) {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr || !signInData.user) {
        setError(signInErr?.message ?? "Could not sign in after registration.");
        setLoading(false);
        return;
      }
      user = signInData.user;
    }

    if (!user) {
      setError("Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    const patch: Record<string, string> = { phone };
    if (role === "student") {
      patch.university = university;
      patch.program = program;
      patch.year_of_study = yearOfStudy;
    }
    if (role === "company") {
      patch.company_sector = companySector;
    }

    await supabase.from("vb_profiles").update(patch).eq("id", user.id);

    if (role === "student") router.push("/pay");
    else if (role === "company") router.push("/company");
    else router.push("/university");
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-4 py-16">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-5">
        <Logo />
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tightest text-ink">Create your account</h1>
          <p className="mt-1.5 text-[15px] text-dim">Join Feasters today</p>
        </div>
      </div>

      <Card className="w-full max-w-md p-8">
        {/* Role pills */}
        <div className="mb-6 flex gap-2">
          {ROLE_OPTIONS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setRole(t.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold transition-all duration-200",
                role === t.key
                  ? "border-ink bg-ink text-white shadow-soft"
                  : "border-line text-dim hover:text-ink"
              )}
            >
              <Icon name={t.icon} className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student fields */}
          {role === "student" && (
            <>
              <Input
                label="Full name"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Email address"
                type="email"
                placeholder="student@msu.ac.zw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                label="Phone number"
                type="tel"
                placeholder="+263 7X XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="University"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
              <Input
                label="Program / Course"
                placeholder="e.g. BSc Computer Science"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
              />
              <Select
                label="Year of study"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                required
              >
                <option value="">Select year</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
                <option value="Postgrad">Postgraduate</option>
              </Select>
            </>
          )}

          {/* Company fields */}
          {role === "company" && (
            <>
              <Input
                label="Company name"
                placeholder="Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <Input
                label="Industry / Sector"
                placeholder="e.g. Technology, Finance"
                value={companySector}
                onChange={(e) => setCompanySector(e.target.value)}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="hr@company.co.zw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                label="Phone number"
                type="tel"
                placeholder="+263 7X XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          {/* University fields */}
          {role === "university" && (
            <>
              <Input
                label="Contact person name"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Institution name"
                placeholder="e.g. Midlands State University"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <Input
                label="Email address"
                type="email"
                placeholder="admin@msu.ac.zw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                label="Phone number"
                type="tel"
                placeholder="+263 7X XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <Button type="submit" variant="primary" arrow disabled={loading} className="w-full py-3 text-[15px]">
            {loading ? (
              <>
                <Spinner />
                {role === "student" ? "Creating account" : "Registering"}
              </>
            ) : role === "student" ? (
              "Create account — $10"
            ) : (
              "Join free"
            )}
          </Button>
        </form>

        {/* Secure signup reassurance */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-faint">
          <Icon name="lock" className="h-3.5 w-3.5" />
          Secure signup — your data is encrypted
        </div>

        <p className="mt-5 text-center text-sm text-dim">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
