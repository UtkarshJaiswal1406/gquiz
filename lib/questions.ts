import rawQuestions from "@/data/questions.json";

export type DifficultyLevel = 1 | 2 | 3;

export type QuizQuestion = {
  id: string;
  difficulty: DifficultyLevel;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
};

export type AnswerResult = {
  nextDifficulty: DifficultyLevel;
  nextStreak: number;
  nextDifficultyStreak: number;
  maxStreak: number;
  isCorrect: boolean;
};

export const QUESTION_COUNT = 10;
export const QUESTION_TIME_SECONDS = 15;
export const FEEDBACK_TIME_MS = 3000;

export const difficultyLabels: Record<DifficultyLevel, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

type ImportedQuestion = Omit<QuizQuestion, "difficulty">;
type RawQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};

const questionBank = rawQuestions as Record<string, RawQuestion[]>;

export const questionsByDifficulty: Record<DifficultyLevel, QuizQuestion[]> = {
  1: (questionBank["1"] || []).map((question) => ({
    ...question,
    difficulty: 1,
    options: question.options as ImportedQuestion["options"],
  })),
  2: (questionBank["2"] || []).map((question) => ({
    ...question,
    difficulty: 2,
    options: question.options as ImportedQuestion["options"],
  })),
  3: (questionBank["3"] || []).map((question) => ({
    ...question,
    difficulty: 3,
    options: question.options as ImportedQuestion["options"],
  })),
};

export function getDifficultyLabel(difficulty: DifficultyLevel) {
  return difficultyLabels[difficulty];
}

export function clampDifficulty(difficulty: number): DifficultyLevel {
  if (difficulty <= 1) {
    return 1;
  }

  if (difficulty >= 3) {
    return 3;
  }

  return difficulty as DifficultyLevel;
}

export function evaluateAnswer(
  currentDifficulty: DifficultyLevel,
  currentStreak: number,
  currentDifficultyStreak: number,
  maxStreak: number,
  isCorrect: boolean,
): AnswerResult {
  if (!isCorrect) {
    return {
      nextDifficulty: clampDifficulty(currentDifficulty - 1),
      nextStreak: 0,
      nextDifficultyStreak: 0,
      maxStreak,
      isCorrect,
    };
  }

  const nextStreak = currentStreak + 1;
  const nextDifficultyStreak = currentDifficultyStreak + 1;
  const nextDifficulty =
    nextDifficultyStreak >= 2 ? clampDifficulty(currentDifficulty + 1) : currentDifficulty;

  return {
    nextDifficulty,
    nextStreak,
    nextDifficultyStreak: nextDifficultyStreak >= 2 ? 0 : nextDifficultyStreak,
    maxStreak: Math.max(maxStreak, nextStreak),
    isCorrect,
  };
}

export function calculateFinalScore(
  correctAnswers: number,
  maxStreak: number,
  timeTakenInSeconds: number,
) {
  return correctAnswers * 100 + maxStreak * 50 - timeTakenInSeconds * 2;
}

function createSearchOrder(start: DifficultyLevel) {
  return [start, 1, 2, 3].filter(
    (difficulty, index, all) => all.indexOf(difficulty) === index,
  ) as DifficultyLevel[];
}

export function pickQuestion(
  difficulty: DifficultyLevel,
  usedQuestionIds: Set<string>,
): QuizQuestion {
  const order = createSearchOrder(difficulty);

  for (const level of order) {
    const availableQuestions = questionsByDifficulty[level].filter(
      (candidate) => !usedQuestionIds.has(candidate.id),
    );

    const question =
      availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

    if (question) {
      return question;
    }
  }

  for (const level of order) {
    const questionList = questionsByDifficulty[level];
    const question = questionList[Math.floor(Math.random() * questionList.length)];
    if (question) {
      return question;
    }
  }

  throw new Error("No quiz questions available.");
}