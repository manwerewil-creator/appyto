export default function PageHeader({
  title, subtitle, right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="topbar">
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>{title}</h1>
        {subtitle ? <div className="muted" style={{ fontSize: 13.5 }}>{subtitle}</div> : null}
      </div>
      {right ? <div className="row">{right}</div> : null}
    </div>
  );
}
