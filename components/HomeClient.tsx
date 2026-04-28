"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { HostControls } from "@/components/HostControls";
import { Leaderboard } from "@/components/Leaderboard";
import { NameEntry } from "@/components/NameEntry";
import { Quiz } from "@/components/Quiz";
import {
  DEFAULT_SESSION,
  endSession,
  startSession,
  subscribeToLeaderboard,
  subscribeToSession,
  type QuizResult,
  type QuizSession,
} from "@/lib/firebase";

export function HomeClient() {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<QuizSession>(DEFAULT_SESSION);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [draftName, setDraftName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeToSession(setSession), []);
  useEffect(() => subscribeToLeaderboard(setResults), []);

  const isHostMode = searchParams.get("host") === "1";
  const quizDescription =
    "A quiz about Google Cloud SQL: managed relational databases and an introduction to Google Cloud SQL.";

  async function handleStartSession() {
    setBusy(true);
    try {
      const nextSession = await startSession();
      setSession(nextSession);
    } finally {
      setBusy(false);
    }
  }

  async function handleEndSession() {
    setBusy(true);
    try {
      const nextSession = await endSession();
      setSession(nextSession);
    } finally {
      setBusy(false);
    }
  }

  function handleJoin() {
    const trimmedName = draftName.trim();
    if (!trimmedName || session.status === "ended") {
      return;
    }

    setPlayerName(trimmedName);
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[#4285F4]/20 blur-3xl" />
        <div className="absolute right-[-5rem] top-[10rem] h-80 w-80 rounded-full bg-[#EA4335]/10 blur-3xl" />
        <div className="absolute bottom-[-7rem] left-[35%] h-80 w-80 rounded-full bg-[#34A853]/10 blur-3xl" />
      </div>

      <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(66,133,244,0.18),_transparent_34%),linear-gradient(135deg,rgba(6,10,20,0.86),rgba(10,16,33,0.82),rgba(15,24,45,0.8))] p-8 text-white shadow-[0_30px_90px_rgba(3,7,18,0.5)] backdrop-blur-xl sm:p-10 lg:px-12 lg:py-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2.5 opacity-95">
            <span className="h-4 w-4 rounded-full bg-[#4285F4] shadow-[0_0_18px_rgba(66,133,244,0.35)]" />
            <span className="h-4 w-4 rounded-full bg-[#EA4335] shadow-[0_0_18px_rgba(234,67,53,0.35)]" />
            <span className="h-4 w-4 rounded-full bg-[#FBBC05] shadow-[0_0_18px_rgba(251,188,5,0.35)]" />
            <span className="h-4 w-4 rounded-full bg-[#34A853] shadow-[0_0_18px_rgba(52,168,83,0.35)]" />
          </div>

          <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            GQuiz
          </h1>

          <p className="max-w-2xl text-sm leading-6 text-slate-200/75 sm:text-base sm:leading-7">
            {quizDescription}
          </p>
        </div>
      </section>

      {isHostMode ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
          <section className="space-y-4">
            <HostControls
              session={session}
              busy={busy}
              onStart={handleStartSession}
              onEnd={handleEndSession}
            />
          </section>

          <aside className="space-y-4">
            <Leaderboard results={results} highlightName={playerName || undefined} />
          </aside>
        </div>
      ) : playerName ? (
        <section className="space-y-4">
          <Quiz
            playerName={playerName}
            session={session}
            leaderboard={results}
          />
        </section>
      ) : (
        <div className="w-full">
          <NameEntry
            draftName={draftName}
            onDraftNameChange={setDraftName}
            onJoin={handleJoin}
            session={session}
          />
        </div>
      )}
    </main>
  );
}