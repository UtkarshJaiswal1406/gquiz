"use client";

import type { QuizResult } from "@/lib/firebase";

type LeaderboardProps = {
  results: QuizResult[];
  highlightName?: string;
};

export function Leaderboard({ results, highlightName }: LeaderboardProps) {
  const orderedResults = [...results].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.timeTaken - right.timeTaken;
  });

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.82),rgba(13,19,37,0.78))] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300/70">
            Shared leaderboard
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">
            Top scores
          </h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">
          {orderedResults.length} entries
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {orderedResults.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-300/70">
            No scores yet. Start a round and submit the first result.
          </div>
        ) : (
          orderedResults.map((result, index) => {
            const isCurrentPlayer = Boolean(highlightName) && result.name === highlightName;

            return (
              <div
                key={result.id}
                className={`flex items-center justify-between rounded-[1.25rem] border px-4 py-4 ${
                  isCurrentPlayer
                    ? "border-[#4285F4]/60 bg-[#4285F4]/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4285F4] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{result.name}</p>
                    <p className="text-xs text-slate-300/70">{result.timeTaken}s</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-white">{result.score}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}