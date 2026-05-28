"use client";

import type { CareerAnalysis } from "@/lib/intelligence/types";
import type { GitHubIntelligence } from "@/lib/intelligence/types";
import { ensureCareerTwin } from "@/lib/intelligence/analysis-normalizer";

const analysisKey = "careeros.latestAnalysis";
const githubKey = "careeros.latestGithub";
const streakKey = "careeros.missionStreak";
const interviewProgressKey = "careeros.interviewProgress";
const sprintProgressPrefix = "careeros.sprintProgress.";

function storageAvailable() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStorage(key: string) {
  if (!storageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Browser storage can be blocked in private mode or strict privacy contexts.
  }
}

export function saveLatestAnalysis(analysis: CareerAnalysis) {
  writeStorage(analysisKey, JSON.stringify(ensureCareerTwin(analysis)));
}

export function clearLatestAnalysis() {
  if (!storageAvailable()) return;
  try {
    window.localStorage.removeItem(analysisKey);
  } catch {
    // Browser storage can be blocked in private mode or strict privacy contexts.
  }
}

export function loadLatestAnalysis(): CareerAnalysis | null {
  const raw = readStorage(analysisKey);
  if (!raw) return null;

  try {
    const analysis = ensureCareerTwin(JSON.parse(raw) as CareerAnalysis);
    writeStorage(analysisKey, JSON.stringify(analysis));
    return analysis;
  } catch {
    return null;
  }
}

export function saveLatestGithub(github: GitHubIntelligence) {
  writeStorage(githubKey, JSON.stringify(github));
}

export function loadLatestGithub(): GitHubIntelligence | null {
  const raw = readStorage(githubKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as GitHubIntelligence;
  } catch {
    return null;
  }
}

export function loadMissionStreak() {
  const raw = readStorage(streakKey);
  return raw ? Number(raw) || 0 : 0;
}

export function incrementMissionStreak() {
  const next = loadMissionStreak() + 1;
  writeStorage(streakKey, String(next));
  return next;
}

export type InterviewProgress = {
  completed: number;
  streak: number;
  bestScore: number;
  weakTopics: string[];
  totalScore?: number;
  strongestTechnologies?: string[];
  weakestConcepts?: string[];
  readinessHistory?: number[];
  technologyScores?: Record<string, number[]>;
};

export function loadInterviewProgress(): InterviewProgress {
  const raw = readStorage(interviewProgressKey);
  if (!raw) {
    return { completed: 0, streak: 0, bestScore: 0, weakTopics: [] };
  }

  try {
    const parsed = JSON.parse(raw) as InterviewProgress;
    return {
      completed: parsed.completed ?? 0,
      streak: parsed.streak ?? 0,
      bestScore: parsed.bestScore ?? 0,
      weakTopics: parsed.weakTopics ?? [],
      totalScore: parsed.totalScore ?? 0,
      strongestTechnologies: parsed.strongestTechnologies ?? [],
      weakestConcepts: parsed.weakestConcepts ?? parsed.weakTopics ?? [],
      readinessHistory: parsed.readinessHistory ?? [],
      technologyScores: parsed.technologyScores ?? {},
    };
  } catch {
    return { completed: 0, streak: 0, bestScore: 0, weakTopics: [] };
  }
}

export function saveInterviewResult(score: number, weakTopics: string[], technology?: string) {
  const current = loadInterviewProgress();
  const technologyScores = { ...(current.technologyScores ?? {}) };
  if (technology) {
    technologyScores[technology] = [...(technologyScores[technology] ?? []), score].slice(-20);
  }
  const strongestTechnologies = Object.entries(technologyScores)
    .map(([name, scores]) => ({
      name,
      average: scores.reduce((total, item) => total + item, 0) / Math.max(scores.length, 1),
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 3)
    .map((item) => item.name);
  const next = {
    completed: current.completed + 1,
    streak: current.streak + 1,
    bestScore: Math.max(current.bestScore, score),
    totalScore: (current.totalScore ?? 0) + score,
    weakTopics: Array.from(new Set([...weakTopics, ...current.weakTopics])).slice(0, 6),
    weakestConcepts: Array.from(new Set([...weakTopics, ...(current.weakestConcepts ?? [])])).slice(0, 8),
    readinessHistory: [...(current.readinessHistory ?? []), score].slice(-12),
    strongestTechnologies,
    technologyScores,
  };
  writeStorage(interviewProgressKey, JSON.stringify(next));
  return next;
}

export function loadSprintProgress(analysisId: string) {
  const raw = readStorage(`${sprintProgressPrefix}${analysisId}`);
  if (!raw) return [] as number[];

  try {
    return JSON.parse(raw) as number[];
  } catch {
    return [];
  }
}

export function toggleSprintDay(analysisId: string, day: number) {
  const current = loadSprintProgress(analysisId);
  const next = current.includes(day)
    ? current.filter((item) => item !== day)
    : [...current, day].sort((a, b) => a - b);
  writeStorage(`${sprintProgressPrefix}${analysisId}`, JSON.stringify(next));
  return next;
}
