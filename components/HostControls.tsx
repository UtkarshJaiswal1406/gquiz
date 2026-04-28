"use client";

import type { QuizSession } from "@/lib/firebase";

type HostControlsProps = {
  session: QuizSession;
  busy: boolean;
  onStart: () => void;
  onEnd: () => void;
};

export function HostControls({ session, busy, onStart, onEnd }: HostControlsProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.82),rgba(13,19,37,0.78))] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-7">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300/70">
          Host controls
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">
          Start and end the shared session
        </h2>
        <p className="text-sm leading-6 text-slate-300/80">
          Start clears previous leaderboard entries. Ending the session hard-stops every
          live quiz and pushes final scores immediately.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onStart}
          disabled={busy || session.status === "active"}
          className="flex-1 rounded-[1.25rem] bg-[#34A853] px-4 py-3 text-base font-semibold text-white shadow-[0_14px_32px_rgba(52,168,83,0.22)] transition hover:bg-[#3dbc5d] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
        >
          Start quiz
        </button>
        <button
          type="button"
          onClick={onEnd}
          disabled={busy || session.status === "ended"}
          className="flex-1 rounded-[1.25rem] bg-[#EA4335] px-4 py-3 text-base font-semibold text-white shadow-[0_14px_32px_rgba(234,67,53,0.22)] transition hover:bg-[#f15c4f] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400"
        >
          End quiz
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Status" value={session.status} />
        <Stat
          label="Start time"
          value={session.startTime ? new Date(session.startTime).toLocaleTimeString() : "—"}
        />
        <Stat
          label="End time"
          value={session.endTime ? new Date(session.endTime).toLocaleTimeString() : "—"}
        />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300/70">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}