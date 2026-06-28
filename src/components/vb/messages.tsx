"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Spinner, Empty, cn } from "@/components/vb/ui";
import { Icon } from "@/components/vb/icons";
import type { Profile } from "@/lib/vb/types";

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string };
type Peer = { id: string; name: string };

export default function Messages({ me, initialPeerId }: { me: Profile; initialPeerId?: string }) {
  const supabase = createClient();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [active, setActive] = useState<string | null>(initialPeerId ?? null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("vb_messages")
      .select("id,sender_id,recipient_id,body,created_at")
      .or(`sender_id.eq.${me.id},recipient_id.eq.${me.id}`)
      .order("created_at", { ascending: true });
    const rows = (data as Msg[]) || [];
    setMsgs(rows);
    const ids = Array.from(new Set(rows.map((m) => (m.sender_id === me.id ? m.recipient_id : m.sender_id))));
    if (initialPeerId && !ids.includes(initialPeerId)) ids.push(initialPeerId);
    if (ids.length) {
      const { data: profs } = await supabase.from("vb_profiles").select("id,full_name,company_name").in("id", ids);
      const ps = (profs || []).map((p: any) => ({ id: p.id, name: p.full_name || p.company_name || "User" }));
      setPeers(ps);
      if (!active && ps.length) setActive(initialPeerId ?? ps[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, active]);

  const thread = msgs.filter(
    (m) => (m.sender_id === me.id && m.recipient_id === active) || (m.sender_id === active && m.recipient_id === me.id)
  );

  const send = async () => {
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText("");
    await supabase.from("vb_messages").insert({ sender_id: me.id, recipient_id: active, body });
    await supabase.from("vb_notifications").insert({ user_id: active, body: `New message from ${me.full_name || me.company_name || "a user"}`, link: "/messages" });
    load();
  };

  if (loading) return <div className="grid place-items-center py-20"><Spinner /></div>;
  if (!peers.length) return <Empty title="No conversations yet" sub="Messages from companies and applicants will appear here." />;

  return (
    <Card className="grid h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-[260px_1fr]">
      <div className="border-b border-line md:border-b-0 md:border-r">
        <div className="max-h-40 overflow-y-auto md:max-h-full">
          {peers.map((p) => (
            <button key={p.id} onClick={() => setActive(p.id)}
              className={cn("flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-paper", active === p.id && "bg-paper")}>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">{p.name[0]?.toUpperCase()}</span>
              <span className="truncate font-medium text-ink">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto bg-paper/40 p-4">
          {thread.map((m) => (
            <div key={m.id} className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm", m.sender_id === me.id ? "ml-auto bg-brand text-white" : "bg-white border border-line text-ink")}>
              {m.body}
            </div>
          ))}
          {!thread.length && <p className="py-10 text-center text-sm text-dim">No messages yet — start the conversation.</p>}
          <div ref={endRef} />
        </div>
        <div className="flex items-center gap-2 border-t border-line p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…" className="flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
          <Button onClick={send}><Icon name="send" className="h-4 w-4" />Send</Button>
        </div>
      </div>
    </Card>
  );
}
