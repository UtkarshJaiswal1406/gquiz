"use client";

import type { QuizQuestion } from "@/lib/questions";

type QuestionFeedback = {
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
};

type QuestionCardProps = {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  difficultyLabel: string;
  currentStreak: number;
  secondsLeft: number;
  locked: boolean;
  feedback: QuestionFeedback | null;
  onSelectAnswer: (answer: string) => void;
};

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  difficultyLabel,
  currentStreak,
  secondsLeft,
  locked,
  feedback,
  onSelectAnswer,
}: QuestionCardProps) {
  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / 15) * 100));

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.82),rgba(13,19,37,0.78))] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-300/80">
          Question {questionNumber}/{totalQuestions}
        </p>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
          {difficultyLabel}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300/70">
            Current streak
          </p>
          <p className="mt-1 text-xl font-semibold text-white">{currentStreak}</p>
        </div>
        <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300/70">
            Time left
          </p>
          <p className="mt-1 text-xl font-semibold text-white">{secondsLeft}s</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05] transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
        {question.question}
      </h2>

      <div className="mt-5 grid gap-3">
        {question.options.map((option) => {
          const isSelected = feedback?.selectedAnswer === option;
          const isCorrect = feedback?.correctAnswer === option;
          const showCorrect = Boolean(feedback) && isCorrect;
          const showWrongSelection = Boolean(feedback) && isSelected && !feedback.isCorrect;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelectAnswer(option)}
              disabled={locked}
              className={`flex min-h-16 items-center justify-between rounded-2xl border px-4 py-4 text-left text-base font-semibold transition focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:cursor-not-allowed ${
                showCorrect
                  ? "border-[#34A853]/60 bg-[#34A853]/15 text-white"
                  : showWrongSelection
                    ? "border-[#EA4335]/60 bg-[#EA4335]/15 text-white"
                    : "border-white/10 bg-white/5 text-white hover:border-[#4285F4]/60 hover:bg-white/10"
              }`}
            >
              <span>{option}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300/70">
                {showCorrect ? "Correct" : showWrongSelection ? "Wrong" : "Tap"}
              </span>
            </button>
          );
        })}
      </div>

      {feedback ? (
        <div
          className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
            feedback.isCorrect
              ? "bg-[#34A853]/15 text-white"
              : "bg-[#EA4335]/15 text-white"
          }`}
        >
          {feedback.isCorrect
            ? "Nice. The answer is locked in and the round will advance shortly."
            : `Correct answer: ${feedback.correctAnswer}`}
        </div>
      ) : null}
    </section>
  );
}