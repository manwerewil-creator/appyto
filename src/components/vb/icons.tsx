import { SVGProps } from "react";

// Single consistent line-icon set (1.6 stroke, round caps) — no emoji, no icon deps.
const P = (d: string | string[]) => (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    width={20}
    height={20}
    {...props}
  >
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

export const Icons = {
  home: P(["M3 11.5 12 4l9 7.5", "M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9", "M10 20v-6h4v6"]),
  search: P(["M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z", "m21 21-4.3-4.3"]),
  file: P(["M14 3v4a1 1 0 0 0 1 1h4", "M5 21V5a2 2 0 0 1 2-2h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z", "M9 13h6", "M9 17h4"]),
  chat: P(["M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5.2A8 8 0 1 1 21 12Z"]),
  user: P(["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M5 20c0-3.3 3.1-5 7-5s7 1.7 7 5"]),
  plus: P(["M12 5v14", "M5 12h14"]),
  building: P(["M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16", "M15 9h4a1 1 0 0 1 1 1v11", "M3 21h18", "M8 8h0M8 12h0M8 16h0M11 8h0M11 12h0M11 16h0"]),
  cap: P(["M22 9 12 5 2 9l10 4 10-4Z", "M6 11v5c0 1.3 2.7 3 6 3s6-1.7 6-3v-5", "M22 9v5"]),
  chart: P(["M4 4v16h16", "M8 16V11", "M13 16V8", "M18 16v-3"]),
  users: P(["M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M2 20c0-3.3 3-5 7-5s7 1.7 7 5", "M16 4.5a4 4 0 0 1 0 7.6", "M22 20c0-2.5-1.6-4.2-4-4.7"]),
  card: P(["M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z", "M3 10h18", "M7 15h3"]),
  logout: P(["M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3", "M16 17l5-5-5-5", "M21 12H9"]),
  briefcase: P(["M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z", "M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1", "M3 13h18"]),
  star: P(["M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5Z"]),
  target: P(["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"]),
  check: P(["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "m8.5 12 2.5 2.5 4.5-5"]),
  pin: P(["M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z", "M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"]),
  calendar: P(["M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6Z", "M4 9h16", "M8 3v4M16 3v4"]),
  clock: P(["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3 2"]),
  arrowRight: P(["M5 12h14", "m13 6 6 6-6 6"]),
  arrowUpRight: P(["M7 17 17 7", "M8 7h9v9"]),
  dollar: P(["M12 3v18", "M16 7.5C16 5.6 14.2 4.5 12 4.5S8 5.8 8 7.5s1.8 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.1-4-3"]),
  shield: P(["M12 3l7 3v5c0 4.4-3 8.3-7 10-4-1.7-7-5.6-7-10V6l7-3Z", "m9 12 2 2 4-4"]),
  bell: P(["M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6", "M10.5 19a1.5 1.5 0 0 0 3 0"]),
  menu: P(["M4 7h16", "M4 12h16", "M4 17h16"]),
  close: P(["M6 6l12 12", "M18 6 6 18"]),
  sparkle: P(["M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"]),
  upload: P(["M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3", "M12 16V4", "m8 8 4-4 4 4"]),
  send: P(["M21 4 3 11l6 2.5L21 4Z", "M9 13.5V20l3.5-4.2", "M21 4l-9 11.5"]),
  eye: P(["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"]),
  chevron: P(["m9 6 6 6-6 6"]),
  external: P(["M14 4h6v6", "M20 4 10 14", "M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"]),
  filter: P(["M3 5h18", "M6 12h12", "M10 19h4"]),
  lock: P(["M6 11V8a6 6 0 1 1 12 0v3", "M5 11h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"]),
  spark2: P(["M5 3v4M3 5h4", "M6 17v4M4 19h4", "M13 4l2.5 6.5L22 13l-6.5 2.5L13 22l-2.5-6.5L4 13l6.5-2.5L13 4Z"]),
};

export type IconName = keyof typeof Icons;

export function Icon({ name, className, ...rest }: { name: IconName; className?: string } & SVGProps<SVGSVGElement>) {
  const C = Icons[name];
  return <C className={className} {...rest} />;
}
