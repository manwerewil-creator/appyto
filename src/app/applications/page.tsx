"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Building2, Mail, Clock, Inbox, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Application } from "@/lib/types";

export default function ApplicationsPage() {
  const [data, setData] = useState<{ items: Application[]; sent: number; failed: number; today: number } | null>(null);

  useEffect(() => { fetch("/api/applications").then((r) => r.json()).then(setData).catch(() => {}); }, []);

  const when = (iso: string | null) => iso ? new Date(iso).toLocaleString() : "—";

  const statusVariant = (status: Application["status"]) =>
    status === "sent" ? "success" : status === "failed" ? "destructive" : "secondary";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-sm text-muted-foreground">Every send is logged here.</p>
        </div>
        {data && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">{data.sent} sent</Badge>
            <Badge variant="secondary">{data.today} today</Badge>
            <Badge variant="destructive">{data.failed} failed</Badge>
          </div>
        )}
      </div>

      {!data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <Card className="text-center">
          <CardHeader className="items-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No applications yet</CardTitle>
            <CardDescription>Head to your matches and apply — every send is logged here.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/matches">
                Go to matches
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold">
                    <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{a.job_title}</span>
                  </div>
                  {a.company && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{a.company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{a.to_email ?? "—"}</span>
                  </div>
                  {a.error && (
                    <p className="max-w-md text-xs text-destructive">{a.error}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {when(a.sent_at ?? a.created_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
