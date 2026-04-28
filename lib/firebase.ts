import { initializeApp, getApp, getApps } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

export type SessionStatus = "waiting" | "active" | "ended";

export type QuizSession = {
  status: SessionStatus;
  startTime: number | null;
  endTime: number | null;
};

export type QuizResult = {
  id: string;
  name: string;
  score: number;
  timeTaken: number;
  createdAt: number;
};

const LOCAL_SESSION_KEY = "gquiz-session";
const LOCAL_RESULTS_KEY = "gquiz-results";
const LOCAL_SYNC_EVENT = "gquiz-storage-sync";
const SESSION_DOC_ID = "current";
const RESULTS_COLLECTION = "quizResults";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

const hasFirebaseConfig =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.authDomain) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);

const app =
  hasFirebaseConfig && getApps().length === 0
    ? initializeApp(firebaseConfig)
    : hasFirebaseConfig
      ? getApp()
      : null;

const db = app ? getFirestore(app) : null;

export const DEFAULT_SESSION: QuizSession = {
  status: "waiting",
  startTime: null,
  endTime: null,
};

function getSessionDocRef() {
  return db ? doc(db, "quizSessions", SESSION_DOC_ID) : null;
}

function getResultsCollectionRef() {
  return db ? collection(db, RESULTS_COLLECTION) : null;
}

function readLocalSession() {
  if (typeof window === "undefined") {
    return DEFAULT_SESSION;
  }

  const raw = window.localStorage.getItem(LOCAL_SESSION_KEY);
  if (!raw) {
    return DEFAULT_SESSION;
  }

  try {
    return JSON.parse(raw) as QuizSession;
  } catch {
    return DEFAULT_SESSION;
  }
}

function readLocalResults() {
  if (typeof window === "undefined") {
    return [] as QuizResult[];
  }

  const raw = window.localStorage.getItem(LOCAL_RESULTS_KEY);
  if (!raw) {
    return [] as QuizResult[];
  }

  try {
    return JSON.parse(raw) as QuizResult[];
  } catch {
    return [] as QuizResult[];
  }
}

function writeLocalSession(session: QuizSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(LOCAL_SYNC_EVENT));
}

function writeLocalResults(results: QuizResult[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_RESULTS_KEY, JSON.stringify(results));
  window.dispatchEvent(new Event(LOCAL_SYNC_EVENT));
}

function sortResults(results: QuizResult[]) {
  return [...results].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.timeTaken - right.timeTaken;
  });
}

function emitLocalSync() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(LOCAL_SYNC_EVENT));
}

export function subscribeToSession(onChange: (session: QuizSession) => void) {
  if (db) {
    const ref = getSessionDocRef();
    if (!ref) {
      onChange(DEFAULT_SESSION);
      return () => undefined;
    }

    return onSnapshot(ref, (snapshot) => {
      if (!snapshot.exists()) {
        onChange(DEFAULT_SESSION);
        return;
      }

      const data = snapshot.data() as Partial<QuizSession>;
      onChange({
        status: data.status ?? "waiting",
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
      });
    }, (error) => {
      console.warn("Firestore session listener failed, falling back to local session state.", error);
      onChange(readLocalSession());
    });
  }

  const handleSync = () => {
    onChange(readLocalSession());
  };

  handleSync();
  window.addEventListener("storage", handleSync);
  window.addEventListener(LOCAL_SYNC_EVENT, handleSync);

  return () => {
    window.removeEventListener("storage", handleSync);
    window.removeEventListener(LOCAL_SYNC_EVENT, handleSync);
  };
}

export function subscribeToLeaderboard(onChange: (results: QuizResult[]) => void) {
  if (db) {
    const ref = getResultsCollectionRef();
    if (!ref) {
      onChange([]);
      return () => undefined;
    }

    return onSnapshot(ref, (snapshot) => {
      const nextResults = snapshot.docs.map((resultDoc) => {
        const data = resultDoc.data();
        return {
          id: resultDoc.id,
          name: String(data.name ?? "Player"),
          score: Number(data.score ?? 0),
          timeTaken: Number(data.timeTaken ?? 0),
          createdAt: Number(data.createdAt ?? Date.now()),
        };
      });

      onChange(sortResults(nextResults));
    }, (error) => {
      console.warn("Firestore leaderboard listener failed, falling back to local results.", error);
      onChange(sortResults(readLocalResults()));
    });
  }

  const handleSync = () => {
    onChange(sortResults(readLocalResults()));
  };

  handleSync();
  window.addEventListener("storage", handleSync);
  window.addEventListener(LOCAL_SYNC_EVENT, handleSync);

  return () => {
    window.removeEventListener("storage", handleSync);
    window.removeEventListener(LOCAL_SYNC_EVENT, handleSync);
  };
}

async function clearResults() {
  if (db) {
    const ref = getResultsCollectionRef();
    if (!ref) {
      return;
    }

    const snapshot = await getDocs(ref);
    await Promise.all(snapshot.docs.map((resultDoc) => deleteDoc(resultDoc.ref)));
    return;
  }

  writeLocalResults([]);
}

export async function startSession() {
  const nextSession: QuizSession = {
    status: "active",
    startTime: Date.now(),
    endTime: null,
  };

  await clearResults();

  if (db) {
    const ref = getSessionDocRef();
    if (!ref) {
      writeLocalSession(nextSession);
      return nextSession;
    }

    await setDoc(ref, nextSession, { merge: false });
    return nextSession;
  }

  writeLocalSession(nextSession);
  return nextSession;
}

export async function endSession() {
  const currentSession = readLocalSession();
  const nextSession: QuizSession = {
    status: "ended",
    startTime: currentSession.startTime,
    endTime: Date.now(),
  };

  if (db) {
    const ref = getSessionDocRef();
    if (!ref) {
      writeLocalSession(nextSession);
      return nextSession;
    }

    await setDoc(ref, nextSession, { merge: false });
    return nextSession;
  }

  writeLocalSession(nextSession);
  return nextSession;
}

export async function submitResult(
  result: Omit<QuizResult, "id" | "createdAt">,
  options?: { allowAfterSessionEnd?: boolean },
) {
  const allowAfterSessionEnd = options?.allowAfterSessionEnd ?? false;

  if (db) {
    const sessionRef = getSessionDocRef();
    if (sessionRef) {
      const snapshot = await getDoc(sessionRef);
      const session = snapshot.exists()
        ? (snapshot.data() as Partial<QuizSession>)
        : DEFAULT_SESSION;

      if (session.status === "ended" && !allowAfterSessionEnd) {
        return null;
      }
    }

    const resultRef = getResultsCollectionRef();
    if (!resultRef) {
      return null;
    }

    const createdAt = Date.now();
    const saved = await addDoc(resultRef, {
      ...result,
      createdAt,
    });

    return {
      id: saved.id,
      ...result,
      createdAt,
    } satisfies QuizResult;
  }

  const session = readLocalSession();
  if (session.status === "ended" && !allowAfterSessionEnd) {
    return null;
  }

  const createdAt = Date.now();
  const nextResult: QuizResult = {
    id: globalThis.crypto?.randomUUID?.() ?? `${createdAt}-${Math.random()}`,
    ...result,
    createdAt,
  };

  writeLocalResults(sortResults([...readLocalResults(), nextResult]));
  emitLocalSync();
  return nextResult;
}