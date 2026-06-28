"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, Badge, Input, Select, Spinner, Empty, Icon } from "@/components/vb/ui";
import { useProfile } from "@/lib/vb/use-profile";
import type { Profile, Application } from "@/lib/vb/types";

export default function UniversityStudentsPage() {
  const { profile, loading, supabase } = useProfile({ requiredRole: "university" });

  const [students, setStudents] = useState<Profile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [stuRes, appRes] = await Promise.all([
        supabase.from("vb_profiles").select("*").eq("role", "student"),
        supabase.from("vb_applications").select("*"),
      ]);
      setStudents(stuRes.data || []);
      setApplications(appRes.data || []);
      setDataLoading(false);
    })();
  }, [profile]);

  const programs = useMemo(() => {
    const set = new Set(students.map((s) => s.program).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [students]);

  const studentAppMap = useMemo(() => {
    const map = new Map<string, Application[]>();
    applications.forEach((a) => {
      const arr = map.get(a.student_id) || [];
      arr.push(a);
      map.set(a.student_id, arr);
    });
    return map;
  }, [applications]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !search ||
        (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(search.toLowerCase());
      const matchProgram = !programFilter || s.program === programFilter;
      return matchSearch && matchProgram;
    });
  }, [students, search, programFilter]);

  const getLatestStatus = (studentId: string): string | null => {
    const apps = studentAppMap.get(studentId) || [];
    if (apps.length === 0) return null;
    const sorted = [...apps].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0].status;
  };

  if (loading || !profile) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-extrabold tracking-tightest text-ink">Students</h2>
        <p className="text-sm text-dim">Verify eligibility and track application progress.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
            <Icon name="search" className="h-4 w-4" />
          </span>
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-56">
          <Select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
            <option value="">All Programs</option>
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="p-8">
            <Empty title="No students found" sub="Try adjusting your filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-xs font-semibold uppercase tracking-wider text-dim">
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Program</th>
                  <th className="px-5 py-3 text-left">Year</th>
                  <th className="px-5 py-3 text-left">Paid</th>
                  <th className="px-5 py-3 text-left">Applications</th>
                  <th className="px-5 py-3 text-left">Latest Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((s) => {
                  const appCount = (studentAppMap.get(s.id) || []).length;
                  const latestStatus = getLatestStatus(s.id);
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-paper/50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-ink">{s.full_name || "—"}</div>
                        <div className="text-xs text-dim">{s.email}</div>
                      </td>
                      <td className="px-5 py-3 text-ink">{s.program || "—"}</td>
                      <td className="px-5 py-3 text-ink">{s.year_of_study || "—"}</td>
                      <td className="px-5 py-3">
                        <Badge tone={s.paid ? "accepted" : "rejected"}>
                          {s.paid ? "Paid" : "Unpaid"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-ink">
                          <Icon name="file" className="h-3.5 w-3.5 text-faint" />
                          <span className="nums font-semibold">{appCount}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {latestStatus ? (
                          <Badge tone={latestStatus}>{latestStatus}</Badge>
                        ) : (
                          <span className="text-dim">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
