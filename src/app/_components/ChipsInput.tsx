"use client";

import { useState } from "react";

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
    <div>
      <div className="row" style={{ flexWrap: "wrap", gap: 6, marginBottom: values.length ? 8 : 0 }}>
        {values.map((v) => (
          <span key={v} className="chip" onClick={() => remove(v)}>
            {v} <span className="x">×</span>
          </span>
        ))}
      </div>
      <input
        className="input"
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
        <div className="row" style={{ flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {suggestions
            .filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()))
            .slice(0, 10)
            .map((s) => (
              <button key={s} type="button" className="tag" style={{ cursor: "pointer" }} onClick={() => add(s)}>
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
