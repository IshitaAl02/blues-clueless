"use client";

import React from "react";
import { colorForUser } from "@/lib/avatar";

// Username rules from lib/auth.ts: 2-20 chars, lowercase letters/numbers/underscore
const MENTION_RE = /@([a-z0-9_]{2,20})/gi;

export type MentionCandidate = { userId: string; username: string };

type Segment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string };

export function parseMentions(text: string): Segment[] {
  const parts: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(MENTION_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ type: "text", value: text.slice(last, idx) });
    parts.push({ type: "mention", value: m[1] });
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

export function MentionPill({ username, mine }: { username: string; mine?: boolean }) {
  const color = colorForUser(username);
  return (
    <span
      className="inline-flex items-center px-1 rounded font-bold"
      style={{
        background: mine ? "rgba(255,255,255,0.25)" : `${color}33`,
        color: mine ? "#5DF8D8" : color,
      }}
    >
      @{username}
    </span>
  );
}

export function RenderTextWithMentions({ text, mine }: { text: string; mine?: boolean }) {
  const segments = parseMentions(text);
  return (
    <>
      {segments.map((s, i) =>
        s.type === "mention" ? (
          <MentionPill key={i} username={s.value} mine={mine} />
        ) : (
          <span key={i}>{s.value}</span>
        ),
      )}
    </>
  );
}
