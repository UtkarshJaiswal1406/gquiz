"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Leaderboard } from "@/components/Leaderboard";
import { QuestionCard } from "@/components/QuestionCard";
import { ResultScreen } from "@/components/ResultScreen";
import { submitResult, type QuizResult, type QuizSession } from "@/lib/firebase";
import {
  calculateFinalScore,
  clampDifficulty,
  evaluateAnswer,
  FEEDBACK_TIME_MS,
  getDifficultyLabel,
  pickQuestion,
  QUESTION_COUNT,
  QUESTION_TIME_SECONDS,
  type DifficultyLevel,
  type QuizQuestion,
} from "@/lib/questions";

type QuizProps = {
  playerName: string;
  session: QuizSession;
  leaderboard: QuizResult[];
};

type QuizPhase = "waiting" | "playing" | "feedback" | "finished";

type QuizStats = {
  correctAnswers: number;
  currentStreak: number;
  difficultyStreak: number;
  maxStreak: number;
  difficulty: DifficultyLevel;
  questionNumber: number;
};

type FeedbackState = {
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
} | null;

export function Quiz({ playerName, session, leaderboard }: QuizProps) {
  const [phase, setPhase] = useState<QuizPhase>("waiting");
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_SECONDS);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [stats, setStats] = useState<QuizStats>({
    correctAnswers: 0,
    currentStreak: 0,
    difficultyStreak: 0,
    maxStreak: 0,
    difficulty: 1,
    questionNumber: 1,
  });
  const [finalResult, setFinalResult] = useState<{
    score: number;
    timeTaken: number;
    hardStop: boolean;
  } | null>(null);
  const [blockedBeforeStart, setBlockedBeforeStart] = useState(false);

  const quizStartTimeRef = useRef<number | null>(null);
  const questionStartedAtRef = useRef<number | null>(null);
  const feedbackStartedAtRef = useRef<number | null>(null);
  const currentSessionStartRef = useRef<number | null>(null);
  const usedQuestionIdsRef = useRef<Set<string>>(new Set());
  const submittedRef = useRef(false);
  const finishedRef = useRef(false);
  const questionLockedRef = useRef(false);

  const resetRound = useCallback((nextDifficulty: DifficultyLevel = 1) => {
    usedQuestionIdsRef.current = new Set();
    submittedRef.current = false;
    finishedRef.current = false;
    questionLockedRef.current = false;
    quizStartTimeRef.current = null;
    questionStartedAtRef.current = null;
    feedbackStartedAtRef.current = null;
    setPhase("waiting");
    setFeedback(null);
    setFinalResult(null);
    setBlockedBeforeStart(false);
    setSecondsLeft(QUESTION_TIME_SECONDS);
    setStats({
      correctAnswers: 0,
      currentStreak: 0,
      difficultyStreak: 0,
      maxStreak: 0,
      difficulty: clampDifficulty(nextDifficulty),
      questionNumber: 1,
    });
    setCurrentQuestion(null);
  }, []);

  const startQuiz = useCallback((nextDifficulty: DifficultyLevel = 1) => {
    if (finishedRef.current || session.status !== "active") {
      return;
    }

    quizStartTimeRef.current = Date.now();
    questionStartedAtRef.current = Date.now();
    feedbackStartedAtRef.current = null;
    questionLockedRef.current = false;
    setBlockedBeforeStart(false);
    setPhase("playing");
    setFeedback(null);
    setSecondsLeft(QUESTION_TIME_SECONDS);

    const firstQuestion = pickQuestion(nextDifficulty, usedQuestionIdsRef.current);
    usedQuestionIdsRef.current.add(firstQuestion.id);
    setCurrentQuestion(firstQuestion);
    setStats({
      correctAnswers: 0,
      currentStreak: 0,
      difficultyStreak: 0,
      maxStreak: 0,
      difficulty: firstQuestion.difficulty,
      questionNumber: 1,
    });
  }, [session.status]);

  const finalizeRound = useCallback(
    (hardStop: boolean) => {
      if (finishedRef.current) {
        return;
      }

      finishedRef.current = true;
      questionLockedRef.current = true;
      setPhase("finished");

      const endTime = Date.now();
      const timeTaken = quizStartTimeRef.current
        ? Math.max(0, Math.round((endTime - quizStartTimeRef.current) / 1000))
        : 0;
      const score = calculateFinalScore(
        stats.correctAnswers,
        stats.maxStreak,
        timeTaken,
      );

      setFinalResult({ score, timeTaken, hardStop });

      if (!submittedRef.current) {
        submittedRef.current = true;
        void submitResult(
          {
            name: playerName,
            score,
            timeTaken,
          },
          { allowAfterSessionEnd: hardStop },
        );
      }
    },
    [playerName, stats.correctAnswers, stats.maxStreak],
  );

  const advanceQuestion = useCallback(() => {
    if (!currentQuestion) {
      return;
    }

    if (stats.questionNumber >= QUESTION_COUNT) {
      finalizeRound(false);
      return;
    }

    const nextQuestion = pickQuestion(stats.difficulty, usedQuestionIdsRef.current);
    usedQuestionIdsRef.current.add(nextQuestion.id);
    questionLockedRef.current = false;
    questionStartedAtRef.current = Date.now();
    feedbackStartedAtRef.current = null;
    setFeedback(null);
    setCurrentQuestion(nextQuestion);
    setSecondsLeft(QUESTION_TIME_SECONDS);
    setStats((current) => ({
      ...current,
      questionNumber: current.questionNumber + 1,
      difficulty: nextQuestion.difficulty,
    }));
    setPhase("playing");
  }, [currentQuestion, finalizeRound, stats.difficulty, stats.questionNumber]);

  const resolveAnswer = useCallback(
    (selectedAnswer: string | null) => {
      if (phase !== "playing" || !currentQuestion || questionLockedRef.current) {
        return;
      }

      questionLockedRef.current = true;
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      const nextState = evaluateAnswer(
        stats.difficulty,
        stats.currentStreak,
        stats.difficultyStreak,
        stats.maxStreak,
        isCorrect,
      );

      setStats((current) => ({
        ...current,
        correctAnswers: current.correctAnswers + (isCorrect ? 1 : 0),
        currentStreak: nextState.nextStreak,
        difficultyStreak: nextState.nextDifficultyStreak,
        maxStreak: nextState.maxStreak,
        difficulty: nextState.nextDifficulty,
      }));
      setFeedback({
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
      });
      feedbackStartedAtRef.current = Date.now();
      setPhase("feedback");
    },
    [
      currentQuestion,
      phase,
      stats.currentStreak,
      stats.difficulty,
      stats.difficultyStreak,
      stats.maxStreak,
    ],
  );

  useEffect(() => {
    if (session.status === "ended" && phase !== "finished") {
      if (!quizStartTimeRef.current) {
        setBlockedBeforeStart(true);
        setPhase("finished");
        return;
      }

      finalizeRound(true);
      return;
    }

    if (session.status === "active") {
      const sessionStart = session.startTime ?? null;
      if (currentSessionStartRef.current !== sessionStart) {
        currentSessionStartRef.current = sessionStart;
        resetRound(1);
      }

      if (phase === "waiting") {
        startQuiz(1);
      }
    }
  }, [finalizeRound, phase, resetRound, session.endTime, session.startTime, session.status, startQuiz]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "feedback") {
      return;
    }

    const timer = window.setInterval(() => {
      const now = Date.now();

      if (phase === "playing" && questionStartedAtRef.current) {
        const elapsed = now - questionStartedAtRef.current;
        const remaining = Math.max(
          0,
          QUESTION_TIME_SECONDS - Math.floor(elapsed / 1000),
        );
        setSecondsLeft(remaining);

        if (elapsed >= QUESTION_TIME_SECONDS * 1000 && !questionLockedRef.current) {
          resolveAnswer(null);
        }
      }

      if (phase === "feedback" && feedbackStartedAtRef.current) {
        if (now - feedbackStartedAtRef.current >= FEEDBACK_TIME_MS) {
          advanceQuestion();
        }
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, [advanceQuestion, currentQuestion, phase, resolveAnswer, stats]);

  const finishedScore = finalResult?.score ?? 0;
  const finishedTime = finalResult?.timeTaken ?? 0;

  if (blockedBeforeStart && !finalResult) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.82),rgba(13,19,37,0.78))] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300/70">
          Session closed
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">
          The host ended the room before the round started.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300/80">
          View the shared leaderboard below or wait for a new session to begin.
        </p>
        <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300/80">
          Your name stays ready for the next round.
        </div>
      </section>
    );
  }

  if (finalResult) {
    return (
      <div className="space-y-4">
        <ResultScreen
          playerName={playerName}
          score={finishedScore}
          correctAnswers={stats.correctAnswers}
          maxStreak={stats.maxStreak}
          timeTaken={finishedTime}
          hardStop={finalResult.hardStop}
        />

        <Leaderboard results={leaderboard} highlightName={playerName} />
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,28,0.82),rgba(13,19,37,0.78))] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300/70">
          Waiting room
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">
          Hi {playerName}, you are queued for the next live round.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-300/80">
          The session is still waiting. Once the host presses start, this quiz will begin
          automatically.
        </p>
        <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300/80">
          Current room status: {session.status}
        </div>
      </section>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="space-y-4">
      <QuestionCard
        question={currentQuestion}
        questionNumber={stats.questionNumber}
        totalQuestions={QUESTION_COUNT}
        difficultyLabel={getDifficultyLabel(stats.difficulty)}
        currentStreak={stats.currentStreak}
        secondsLeft={secondsLeft}
        locked={phase !== "playing"}
        feedback={feedback}
        onSelectAnswer={resolveAnswer}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SmallStat label="Score so far" value={`${stats.correctAnswers * 100}`} accent="blue" />
        <SmallStat label="Current streak" value={String(stats.currentStreak)} accent="red" />
        <SmallStat label="Max streak" value={String(stats.maxStreak)} accent="yellow" />
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "blue" | "red" | "yellow";
}) {
  const accentClasses = {
    blue: "border-[#4285F4]/25 bg-[linear-gradient(180deg,rgba(66,133,244,0.12),rgba(66,133,244,0.06))]",
    red: "border-[#EA4335]/25 bg-[linear-gradient(180deg,rgba(234,67,53,0.12),rgba(234,67,53,0.06))]",
    yellow: "border-[#FBBC05]/25 bg-[linear-gradient(180deg,rgba(251,188,5,0.12),rgba(251,188,5,0.06))]",
  };

  return (
    <div className={`rounded-[1.5rem] border px-4 py-3.5 text-white shadow-[0_18px_36px_rgba(15,23,42,0.2)] backdrop-blur ${accentClasses[accent]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200/75">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}