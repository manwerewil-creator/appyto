import type { Resume, TemplateId } from "@/lib/resume";
import s from "./resume.module.css";

const ic = { mail: "✉", phone: "☎", pin: "⚲", link: "🔗", web: "❖" };

function Contacts({ r, cls }: { r: Resume; cls?: string }) {
  return (
    <div className={`${s.contactRow} ${cls ?? ""}`}>
      {r.email && <span>{ic.mail} {r.email}</span>}
      {r.phone && <span>{ic.phone} {r.phone}</span>}
      {r.location && <span>{ic.pin} {r.location}</span>}
      {r.linkedin && <span>{ic.link} {r.linkedin}</span>}
      {r.website && <span>{ic.web} {r.website}</span>}
    </div>
  );
}

const range = (a: string, b: string) => [a, b].filter(Boolean).join(" – ");
const initials = (n: string) => n.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase();

/* ── Classic ──────────────────────────────────────────────────────────────*/
function Classic({ r }: { r: Resume }) {
  return (
    <div className={`${s.sheet} ${s.classic}`}>
      <div className={s.classicName}>{r.full_name || "Your Name"}</div>
      {r.headline && <div className={s.classicHead}>{r.headline}</div>}
      <Contacts r={r} cls={s.classicContact} />

      {r.summary && (<><div className={s.classicSecTitle}>Summary</div><p>{r.summary}</p></>)}

      {r.experience.length > 0 && (
        <><div className={s.classicSecTitle}>Experience</div>
          {r.experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 9 }}>
              <div className={s.classicJob}>
                <h4>{e.role}{e.company ? `, ${e.company}` : ""}</h4>
                <span className={s.classicJobMeta}>{range(e.start, e.end)}</span>
              </div>
              {e.location && <div className={s.classicJobMeta}>{e.location}</div>}
              {e.bullets.length > 0 && <ul>{e.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}
        </>
      )}

      {r.education.length > 0 && (
        <><div className={s.classicSecTitle}>Education</div>
          {r.education.map((e, i) => (
            <div key={i} className={s.classicJob} style={{ marginBottom: 4 }}>
              <h4>{e.degree}{e.institution ? `, ${e.institution}` : ""}</h4>
              <span className={s.classicJobMeta}>{range(e.start, e.end)}</span>
            </div>
          ))}
        </>
      )}

      {r.skills.length > 0 && (
        <><div className={s.classicSecTitle}>Skills</div>
          <div className={s.classicSkills}>{r.skills.map((k, i) => <span key={i}>• {k.name}</span>)}</div>
        </>
      )}
      {r.certifications.length > 0 && (
        <><div className={s.classicSecTitle}>Certifications</div>
          <ul>{r.certifications.map((c, i) => <li key={i}>{c}</li>)}</ul></>
      )}
    </div>
  );
}

/* ── Modern ───────────────────────────────────────────────────────────────*/
function Modern({ r }: { r: Resume }) {
  const ac = { color: r.accent };
  return (
    <div className={s.sheet}>
      <div className={s.modernHeader} style={{ background: r.accent }}>
        <div className={s.modernName}>{r.full_name || "Your Name"}</div>
        {r.headline && <div className={s.modernHead}>{r.headline}</div>}
        <Contacts r={r} cls={s.modernContact} />
      </div>
      <div className={s.modernBody}>
        <div>
          {r.experience.length > 0 && (
            <div className={s.modernBlock}>
              <div className={s.modernSecTitle} style={ac}>Experience</div>
              {r.experience.map((e, i) => (
                <div key={i} className={s.modernJob}>
                  <h4>{e.role}</h4>
                  <div className={s.modernJobMeta}><span>{e.company}{e.location ? ` · ${e.location}` : ""}</span><span>{range(e.start, e.end)}</span></div>
                  {e.bullets.length > 0 && <ul>{e.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
                </div>
              ))}
            </div>
          )}
          {r.education.length > 0 && (
            <div className={s.modernBlock}>
              <div className={s.modernSecTitle} style={ac}>Education</div>
              {r.education.map((e, i) => (
                <div key={i} className={s.modernJob}>
                  <h4>{e.degree}</h4>
                  <div className={s.modernJobMeta}><span>{e.institution}{e.location ? ` · ${e.location}` : ""}</span><span>{range(e.start, e.end)}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          {r.summary && (
            <div className={s.modernBlock}>
              <div className={s.modernSecTitle} style={ac}>Summary</div>
              <p>{r.summary}</p>
            </div>
          )}
          {r.skills.length > 0 && (
            <div className={s.modernBlock}>
              <div className={s.modernSecTitle} style={ac}>Skills</div>
              <div className={s.chipList}>{r.skills.map((k, i) => <span key={i}>{k.name}</span>)}</div>
            </div>
          )}
          {r.achievements.length > 0 && (
            <div className={s.modernBlock}>
              <div className={s.modernSecTitle} style={ac}>Achievements</div>
              <ul>{r.achievements.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}
          {r.certifications.length > 0 && (
            <div className={s.modernBlock}>
              <div className={s.modernSecTitle} style={ac}>Certifications</div>
              <ul>{r.certifications.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}
          {r.languages.length > 0 && (
            <div className={s.modernBlock}>
              <div className={s.modernSecTitle} style={ac}>Languages</div>
              <div className={s.chipList}>{r.languages.map((l, i) => <span key={i}>{l}</span>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar (photo + ratings) ────────────────────────────────────────────*/
function Dots({ n }: { n: number }) {
  return <span className={s.dots}>{[1,2,3,4,5].map((i) => <span key={i} className={`${s.dot} ${i <= n ? s.dotOn : ""}`} />)}</span>;
}
function Sidebar({ r }: { r: Resume }) {
  return (
    <div className={s.sheet}>
      <div className={s.sidebarWrap}>
        <div className={s.sidebarCol} style={{ background: r.accent }}>
          {r.photo
            ? <img className={s.sidebarPhoto} src={r.photo} alt="" />
            : <div className={s.sidebarPhotoFallback}>{initials(r.full_name || "Y N")}</div>}
          <div className={s.sidebarSecTitle}>Contact</div>
          <div style={{ fontSize: 9.4, display: "grid", gap: 4 }}>
            {r.email && <div>{ic.mail} {r.email}</div>}
            {r.phone && <div>{ic.phone} {r.phone}</div>}
            {r.location && <div>{ic.pin} {r.location}</div>}
            {r.linkedin && <div>{ic.link} {r.linkedin}</div>}
            {r.website && <div>{ic.web} {r.website}</div>}
          </div>
          {r.skills.length > 0 && (
            <><div className={s.sidebarSecTitle}>Skills</div>
              {r.skills.map((k, i) => (
                <div key={i} className={s.ratingRow}><span>{k.name}</span><Dots n={k.level} /></div>
              ))}</>
          )}
          {r.languages.length > 0 && (
            <><div className={s.sidebarSecTitle}>Languages</div>
              <div style={{ fontSize: 9.6, display: "grid", gap: 3 }}>{r.languages.map((l, i) => <div key={i}>{l}</div>)}</div></>
          )}
        </div>
        <div className={s.mainCol}>
          <div className={s.mainName}>{r.full_name || "Your Name"}</div>
          {r.headline && <div className={s.mainHead}>{r.headline}</div>}
          {r.summary && (<><div className={s.mainSecTitle} style={{ color: r.accent }}>Profile</div><p>{r.summary}</p></>)}
          {r.experience.length > 0 && (
            <><div className={s.mainSecTitle} style={{ color: r.accent }}>Experience</div>
              {r.experience.map((e, i) => (
                <div key={i} style={{ marginBottom: 9 }}>
                  <h4 style={{ margin: 0, fontSize: 11 }}>{e.role}</h4>
                  <div className={s.modernJobMeta}><span>{e.company}{e.location ? ` · ${e.location}` : ""}</span><span>{range(e.start, e.end)}</span></div>
                  {e.bullets.length > 0 && <ul>{e.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
                </div>
              ))}</>
          )}
          {r.education.length > 0 && (
            <><div className={s.mainSecTitle} style={{ color: r.accent }}>Education</div>
              {r.education.map((e, i) => (
                <div key={i} style={{ marginBottom: 5 }}>
                  <h4 style={{ margin: 0, fontSize: 11 }}>{e.degree}</h4>
                  <div className={s.modernJobMeta}><span>{e.institution}</span><span>{range(e.start, e.end)}</span></div>
                </div>
              ))}</>
          )}
          {r.certifications.length > 0 && (
            <><div className={s.mainSecTitle} style={{ color: r.accent }}>Certifications</div>
              <ul>{r.certifications.map((c, i) => <li key={i}>{c}</li>)}</ul></>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Minimal ──────────────────────────────────────────────────────────────*/
function Minimal({ r }: { r: Resume }) {
  return (
    <div className={`${s.sheet} ${s.minimal}`}>
      <div className={s.minimalName} style={{ color: r.accent }}>{r.full_name || "Your Name"}</div>
      {r.headline && <div className={s.minimalHead}>{r.headline}</div>}
      <Contacts r={r} cls={s.minimalContact} />
      <div className={s.minimalRule} />

      {r.summary && (<><div className={s.minimalSecTitle}>Profile</div><p style={{ marginBottom: 16 }}>{r.summary}</p></>)}

      {r.experience.length > 0 && (
        <><div className={s.minimalSecTitle}>Experience</div>
          {r.experience.map((e, i) => (
            <div key={i} className={s.minimalJob}>
              <h4>{e.role} · <span style={{ fontWeight: 400 }}>{e.company}</span></h4>
              <div className={s.minimalJobMeta}>{range(e.start, e.end)}{e.location ? ` · ${e.location}` : ""}</div>
              {e.bullets.length > 0 && <ul>{e.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}<div className={s.minimalRule} /></>
      )}

      {r.education.length > 0 && (
        <><div className={s.minimalSecTitle}>Education</div>
          {r.education.map((e, i) => (
            <div key={i} className={s.minimalJob}>
              <h4>{e.degree}</h4>
              <div className={s.minimalJobMeta}>{e.institution} · {range(e.start, e.end)}</div>
            </div>
          ))}<div className={s.minimalRule} /></>
      )}

      {r.skills.length > 0 && (
        <><div className={s.minimalSecTitle}>Skills</div>
          <p>{r.skills.map((k) => k.name).join("  ·  ")}</p></>
      )}
    </div>
  );
}

const MAP: Record<TemplateId, (p: { r: Resume }) => React.ReactElement> = {
  classic: Classic, modern: Modern, sidebar: Sidebar, minimal: Minimal,
};

export default function ResumeSheet({ resume }: { resume: Resume }) {
  const T = MAP[resume.template] ?? Modern;
  return <T r={resume} />;
}
