"use client";

import React from "react";
import { colorForUser } from "@/lib/avatar";

// Username rules from lib/auth.ts: 2-20 chars, lowercase letters/numbers/underscore
const MENTION_RE = /@([a-z0-9_]{2,20})/gi;
// http(s) URL detector — stops at whitespace.
const URL_RE = /\bhttps?:\/\/[^\s<>]+/gi;

export type MentionCandidate = { userId: string; username: string };

type Segment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string }
  | { type: "link"; value: string };

export function parseMentions(text: string): Segment[] {
  // Find all matches (mentions + links), sort by index, then weave plain text between.
  type Match = { idx: number; len: number; seg: Segment };
  const matches: Match[] = [];
  for (const m of text.matchAll(MENTION_RE)) {
    matches.push({ idx: m.index ?? 0, len: m[0].length, seg: { type: "mention", value: m[1] } });
  }
  for (const m of text.matchAll(URL_RE)) {
    matches.push({ idx: m.index ?? 0, len: m[0].length, seg: { type: "link", value: m[0] } });
  }
  matches.sort((a, b) => a.idx - b.idx);

  const parts: Segment[] = [];
  let last = 0;
  for (const m of matches) {
    if (m.idx < last) continue; // skip overlaps (mention inside URL etc.)
    if (m.idx > last) parts.push({ type: "text", value: text.slice(last, m.idx) });
    parts.push(m.seg);
    last = m.idx + m.len;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

function truncate(s: string, max = 60): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

function prettyLink(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname;
    return truncate(u.host + path);
  } catch {
    return truncate(url);
  }
}

export function LinkPill({ url, mine }: { url: string; mine?: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold underline decoration-2 underline-offset-2 break-all hover:brightness-110 transition"
      style={{
        background: mine ? "rgba(255,255,255,0.18)" : "rgba(9,60,93,0.08)",
        color: mine ? "#ECFCFB" : "#093C5D",
      }}
      title={url}
    >
      <span aria-hidden>🔗</span>
      <span>{prettyLink(url)}</span>
    </a>
  );
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
        ) : s.type === "link" ? (
          <LinkPill key={i} url={s.value} mine={mine} />
        ) : (
          <span key={i}>{s.value}</span>
        ),
      )}
    </>
  );
}
