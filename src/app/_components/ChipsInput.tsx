"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

// Comma/Enter-separated tag input used for job preferences.
export default function ChipsInput({
  values, onChange, placeholder, suggestions = [],
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const v = raw.trim();
    if (v && !values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    setDraft("");
  };
  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  return (
    <div className="space-y-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1 pr-1 font-normal">
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
                aria-label={`Remove ${v}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(draft); }
          else if (e.key === "Backspace" && !draft && values.length) remove(values[values.length - 1]);
        }}
        onBlur={() => draft && add(draft)}
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()))
            .slice(0, 10)
            .map((s) => (
              <button key={s} type="button" onClick={() => add(s)}>
                <Badge variant="outline" className="cursor-pointer gap-1 font-normal hover:bg-accent">
                  <Plus className="h-3 w-3" />
                  {s}
                </Badge>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
