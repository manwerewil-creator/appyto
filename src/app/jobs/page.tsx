"use client";

import { useEffect, useState, useCallback } from "react";
import JobCard from "../_components/JobCard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Job } from "@/lib/types";

interface Facet { value: string; n: number; }

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function JobsPage() {
  const [items, setItems] = useState<Job[]>([]);
  const [filtered, setFiltered] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [onlyEmail, setOnlyEmail] = useState(false);
  const [facets, setFacets] = useState<{ categories: Facet[]; locations: Facet[]; types: Facet[] }>({
    categories: [], locations: [], types: [],
  });

  useEffect(() => { fetch("/api/facets").then((r) => r.json()).then(setFacets).catch(() => {}); }, []);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const qs = new URLSearchParams({
      search, category, location, type, page: String(p), pageSize: "25",
      ...(onlyEmail ? { onlyEmail: "1" } : {}),
    });
    const r = await fetch(`/api/jobs?${qs}`);
    const d = await r.json();
    setItems(d.items); setFiltered(d.filtered); setPage(d.page); setLoading(false);
  }, [search, category, location, type, onlyEmail]);

  useEffect(() => { const t = setTimeout(() => load(1), 250); return () => clearTimeout(t); }, [load]);

  const pages = Math.ceil(filtered / 25);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Jobs</h1>
        <p className="text-sm text-muted-foreground">{filtered.toLocaleString()} open jobs</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1 lg:row-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search title, company, description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {facets.categories.map((f) => <option key={f.value} value={f.value}>{f.value} ({f.n})</option>)}
            </select>
            <select className={selectClass} value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">All locations</option>
              {facets.locations.map((f) => <option key={f.value} value={f.value}>{f.value} ({f.n})</option>)}
            </select>
            <select className={selectClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {facets.types.map((f) => <option key={f.value} value={f.value}>{f.value} ({f.n})</option>)}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              checked={onlyEmail}
              onChange={(e) => setOnlyEmail(e.target.checked)}
            />
            Only jobs I can apply to by email
          </label>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No jobs match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((j) => <JobCard key={j.id} job={j} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages.toLocaleString()}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => load(page + 1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
