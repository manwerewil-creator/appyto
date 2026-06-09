"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "../_components/PageHeader";
import JobCard from "../_components/JobCard";
import type { Job } from "@/lib/types";

interface Facet { value: string; n: number; }

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
    <>
      <PageHeader title="All Jobs" subtitle={`${filtered.toLocaleString()} open jobs`} />
      <div className="content">
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="grid" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10 }}>
            <input className="input" placeholder="Search title, company, description…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {facets.categories.map((f) => <option key={f.value} value={f.value}>{f.value} ({f.n})</option>)}
            </select>
            <select className="select" value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">All locations</option>
              {facets.locations.map((f) => <option key={f.value} value={f.value}>{f.value} ({f.n})</option>)}
            </select>
            <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {facets.types.map((f) => <option key={f.value} value={f.value}>{f.value} ({f.n})</option>)}
            </select>
          </div>
          <label className="row" style={{ marginTop: 10, fontSize: 14, cursor: "pointer", gap: 8 }}>
            <input type="checkbox" checked={onlyEmail} onChange={(e) => setOnlyEmail(e.target.checked)} />
            Only jobs I can apply to by email
          </label>
        </div>

        {loading ? (
          <div className="empty">Loading jobs…</div>
        ) : items.length === 0 ? (
          <div className="empty">No jobs match your filters.</div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))" }}>
            {items.map((j) => <JobCard key={j.id} job={j} />)}
          </div>
        )}

        {pages > 1 && (
          <div className="row" style={{ justifyContent: "center", marginTop: 22, gap: 12 }}>
            <button className="btn ghost sm" disabled={page <= 1} onClick={() => load(page - 1)}>← Prev</button>
            <span className="muted">Page {page} of {pages.toLocaleString()}</span>
            <button className="btn ghost sm" disabled={page >= pages} onClick={() => load(page + 1)}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}
