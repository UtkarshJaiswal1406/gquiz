"use client";

import type { QuizSession } from "@/lib/firebase";

type NameEntryProps = {
  draftName: string;
  onDraftNameChange: (value: string) => void;
  onJoin: () => void;
  session: QuizSession;
};

export function NameEntry({
  draftName,
  onDraftNameChange,
  onJoin,
  session,
}: NameEntryProps) {
  const isBlocked = session.status === "ended";
  const canJoin = !isBlocked && draftName.trim().length > 0;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.82),rgba(13,19,37,0.78))] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-7">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300/70">
          Join the round
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">
          Enter your name to play
        </h2>
        <p className="text-sm leading-6 text-slate-300/80">
          You can join while the room is waiting. Once the host starts the session, the
          quiz begins automatically.
        </p>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onJoin();
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200/80">Display name</span>
          <input
            value={draftName}
            onChange={(event) => onDraftNameChange(event.target.value)}
            disabled={isBlocked}
            placeholder={isBlocked ? "Session ended" : "Alex"}
            className="w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none ring-0 transition placeholder:text-slate-400 focus:border-[#4285F4]/60 focus:shadow-[0_0_0_4px_rgba(66,133,244,0.14)] disabled:cursor-not-allowed disabled:bg-white/5"
          />
        </label>

        <button
          type="submit"
          aria-disabled={!canJoin}
          className={`flex w-full items-center justify-center rounded-[1.25rem] px-4 py-3 text-base font-semibold text-white transition ${
            canJoin
              ? "bg-[#4285F4] shadow-[0_14px_32px_rgba(66,133,244,0.28)] hover:bg-[#5a95f5]"
              : "cursor-not-allowed bg-white/10 text-slate-400"
          }`}
        >
          {isBlocked ? "Session ended" : "Join quiz"}
        </button>
      </form>

      <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
        <span className="font-semibold text-slate-200/80">Live status:</span> {session.status}
      </div>
    </section>
  );
}