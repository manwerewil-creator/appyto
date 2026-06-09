"use client";

import { useEffect, useState, useCallback } from "react";
import JobBoardCard from "../_components/JobBoardCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GlassSearch } from "@/components/ui/glass-search";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import type { Job } from "@/lib/types";

interface Facet { value: string; n: number; }

// Pill-style dropdown to mirror the reference board's filter chips.
const selectClass =
  "h-11 appearance-none rounded-full border border-border bg-white pl-4 pr-9 text-sm font-medium shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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

  const Dropdown = ({ value, onChange, placeholder, opts }: {
    value: string; onChange: (v: string) => void; placeholder: string; opts: Facet[];
  }) => (
    <div className="relative">
      <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {opts.map((f) => <option key={f.value} value={f.value}>{f.value} ({f.n})</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Jobs in Zimbabwe</h1>
        <p className="text-sm text-muted-foreground">
          Browse all {filtered.toLocaleString()} open jobs.
        </p>
      </div>

      {/* Search + filter pills */}
      <div className="flex flex-wrap items-center gap-3">
        <GlassSearch
          containerClassName="min-w-[240px] flex-1"
          placeholder="Search job title, skill, company"
          value={search}
          onChange={setSearch}
        />
        <Dropdown value={location} onChange={setLocation} placeholder="Location" opts={facets.locations} />
        <Dropdown value={category} onChange={setCategory} placeholder="Category" opts={facets.categories} />
        <Dropdown value={type} onChange={setType} placeholder="Type" opts={facets.types} />
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input accent-primary"
          checked={onlyEmail}
          onChange={(e) => setOnlyEmail(e.target.checked)}
        />
        Only jobs I can apply to by email
      </label>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-muted/30 py-12 text-center text-sm text-muted-foreground">
          No jobs match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((j, i) => <JobBoardCard key={j.id} job={j} index={i} />)}
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
