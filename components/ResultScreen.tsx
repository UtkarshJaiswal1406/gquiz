"use client";

type ResultScreenProps = {
  playerName: string;
  score: number;
  correctAnswers: number;
  maxStreak: number;
  timeTaken: number;
  hardStop?: boolean;
};

export function ResultScreen({
  playerName,
  score,
  correctAnswers,
  maxStreak,
  timeTaken,
  hardStop = false,
}: ResultScreenProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.82),rgba(13,19,37,0.78))] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300/70">
        {hardStop ? "Session ended" : "Round complete"}
      </p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
        {playerName}, your score is {score}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300/80">
        {hardStop
          ? "The host ended the session, so this final score was submitted immediately."
          : "Your final result was submitted and is now visible on the shared leaderboard."}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Correct" value={String(correctAnswers)} accent="blue" />
        <Stat label="Best streak" value={String(maxStreak)} accent="red" />
        <Stat label="Time taken" value={`${timeTaken}s`} accent="yellow" />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "blue" | "red" | "yellow";
}) {
  const accentClasses = {
    blue: "bg-[#4285F4]/10 border-[#4285F4]/25",
    red: "bg-[#EA4335]/10 border-[#EA4335]/25",
    yellow: "bg-[#FBBC05]/10 border-[#FBBC05]/25",
  };

  return (
    <div className={`rounded-[1.25rem] border px-4 py-3 ${accentClasses[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300/70">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}