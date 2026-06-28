"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, Button, Spinner, Empty, Stat, Eyebrow } from "@/components/vb/ui";
import { useProfile } from "@/lib/vb/use-profile";
import type { Profile, Application } from "@/lib/vb/types";

const APP_STATUSES = ["pending", "shortlisted", "interview", "accepted", "rejected"] as const;
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-400",
  shortlisted: "bg-brand",
  interview: "bg-violet-500",
  accepted: "bg-grass",
  rejected: "bg-red-400",
};

export default function UniversityReportsPage() {
  const { profile, loading, supabase } = useProfile({ requiredRole: "university" });

  const [students, setStudents] = useState<Profile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

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

  const byProgram = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => {
      const key = s.program || "Unknown";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [students]);

  const byStatus = useMemo(() => {
    return APP_STATUSES.map((status) => ({
      status,
      count: applications.filter((a) => a.status === status).length,
    }));
  }, [applications]);

  const maxProgramCount = Math.max(...byProgram.map((p) => p[1]), 1);
  const maxStatusCount = Math.max(...byStatus.map((s) => s.count), 1);

  const placedCount = useMemo(() => {
    const placedIds = new Set(
      applications.filter((a) => a.status === "accepted").map((a) => a.student_id)
    );
    return placedIds.size;
  }, [applications]);

  const placementRate =
    students.length > 0 ? Math.round((placedCount / students.length) * 100) : 0;

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-xl font-extrabold tracking-tightest text-ink">Aggregate Report</h2>
          <p className="text-sm text-dim">Summary of student registrations and placement outcomes.</p>
        </div>
        <Button onClick={() => window.print()} variant="outline">
          <span className="inline-flex items-center gap-2">
            Print / Export
          </span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat icon="cap" value={students.length} label="Total Registered" accent="brand" />
        <Stat icon="card" value={students.filter((s) => s.paid).length} label="Paid Students" accent="accent" />
        <Stat icon="check" value={placedCount} label="Placed Students" accent="accent" />
        <Stat icon="target" value={`${placementRate}%`} label="Placement Rate" accent="brand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <Eyebrow>By Program</Eyebrow>
          <h3 className="mb-4 mt-3 font-semibold text-ink">Students by Program</h3>
          {byProgram.length === 0 ? (
            <Empty title="No data" />
          ) : (
            <div className="space-y-3">
              {byProgram.map(([program, count]) => (
                <div key={program}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{program}</span>
                    <span className="nums font-bold text-ink">{count}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${(count / maxProgramCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <Eyebrow>By Status</Eyebrow>
          <h3 className="mb-4 mt-3 font-semibold text-ink">Applications by Status</h3>
          {applications.length === 0 ? (
            <Empty title="No applications yet" />
          ) : (
            <div className="space-y-3">
              {byStatus.map(({ status, count }) => (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-ink">{status}</span>
                    <span className="nums font-bold text-ink">{count}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-paper">
                    <div
                      className={`h-full rounded-full transition-all ${STATUS_COLORS[status] || "bg-dim"}`}
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <style>{`
        @media print {
          aside, header, nav, button { display: none !important; }
          main { padding-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
