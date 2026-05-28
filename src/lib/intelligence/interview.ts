import OpenAI from "openai";
import type { CareerAnalysis } from "@/lib/intelligence/types";

export const technologies = [
  "Python",
  "Java",
  "SQL",
  "JavaScript",
  "React",
  "Machine Learning",
  "Data Structures",
  "System Design",
  "Cloud Computing",
] as const;

export const difficulties = ["Beginner", "Intermediate", "Advanced"] as const;
export const technicalCategories = ["Coding Concepts", "Theory", "Scenario", "Debugging", "Project Discussion"] as const;

export type InterviewTechnology = (typeof technologies)[number];
export type InterviewDifficulty = (typeof difficulties)[number];
export type TechnicalCategory = (typeof technicalCategories)[number];
export type InterviewMode = "Training" | "Real Interview";

export type AskedQuestionMemory = {
  question: string;
  concept: string;
  category: TechnicalCategory;
  difficulty: InterviewDifficulty;
};

export type TopicMastery = {
  topic: string;
  score: number;
  confidence: number;
  attempts: number;
  trend: "up" | "steady" | "down";
};

export type InterviewTurn = {
  question: string;
  answer?: string;
  concept?: string;
  category?: TechnicalCategory;
  difficulty?: InterviewDifficulty;
  feedback?: InterviewFeedback;
};

export type InterviewFeedback = {
  correctness: number;
  technicalDepth: number;
  clarity: number;
  communicationQuality: number;
  confidence: number;
  problemSolvingQuality: number;
  missingConcepts: string[];
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  strongerAnswer: string;
  explanation: string;
  interviewTips: string[];
  recruiterImpression: string;
};

export type InterviewResponse = {
  feedback?: InterviewFeedback;
  nextQuestion: string;
  followUpQuestion: string;
  nextConcept: string;
  nextCategory: TechnicalCategory;
  nextDifficulty: InterviewDifficulty;
  adaptiveReason: string;
  overallInterviewScore: number;
  technicalScore: number;
  communicationScore: number;
  confidenceLevel: string;
  recruiterImpression: string;
  topicsToRevise: string[];
  mistakesToAvoid: string[];
  strongTopics: string[];
  weakTopics: string[];
  mastery: TopicMastery[];
  readinessGrowth: number;
  isComplete: boolean;
};

const conceptMap: Record<InterviewTechnology, string[]> = {
  Python: ["data types", "functions", "OOP", "iterators", "exceptions", "performance", "testing"],
  Java: ["OOP", "collections", "generics", "JVM memory", "concurrency", "exceptions", "streams"],
  SQL: ["joins", "aggregation", "indexes", "transactions", "query optimization", "window functions", "schema design"],
  JavaScript: ["closures", "async", "event loop", "prototypes", "types", "DOM", "error handling"],
  React: ["components", "state", "hooks", "rendering", "performance", "data fetching", "component design"],
  "Machine Learning": ["model selection", "features", "training", "evaluation", "overfitting", "deployment", "bias"],
  "Data Structures": ["arrays", "hash maps", "stacks", "queues", "trees", "graphs", "complexity"],
  "System Design": ["requirements", "APIs", "databases", "caching", "queues", "scaling", "reliability"],
  "Cloud Computing": ["compute", "storage", "networking", "IAM", "autoscaling", "monitoring", "cost optimization"],
};

const categoryByTurn: TechnicalCategory[] = ["Theory", "Coding Concepts", "Scenario", "Debugging", "Project Discussion"];

export async function runInterviewTurn({
  analysis,
  technology,
  difficulty,
  mode,
  turns,
  askedQuestions,
  weakTopics,
  latestAnswer,
}: {
  analysis?: CareerAnalysis;
  technology: InterviewTechnology;
  difficulty: InterviewDifficulty;
  mode: InterviewMode;
  turns: InterviewTurn[];
  askedQuestions: AskedQuestionMemory[];
  weakTopics: string[];
  latestAnswer?: string;
}): Promise<InterviewResponse> {
  const fallback = fallbackInterviewTurn({ analysis, technology, difficulty, mode, turns, askedQuestions, weakTopics, latestAnswer });

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are CareerOS Technical Interview Arena: a realistic interviewer, adaptive mentor, and technical coach. This is not a chatbot. Ask exactly one technical interview question at a time. Evaluate the latest answer like a senior interviewer: correctness, depth, clarity, missing concepts, and communication. Adapt difficulty gradually, target weak topics, avoid repeated concepts and question patterns from memory, and keep the experience recruiter-like. Return strict JSON matching the provided shape.",
        },
        {
          role: "user",
          content: JSON.stringify({
            technology,
            difficulty,
            mode,
            latestAnswer,
            turns,
            askedQuestions,
            weakTopics,
            profile: analysis ? compactInterviewProfile(analysis) : null,
            rules: [
              "Generate one question only.",
              "Do not repeat exact questions, same pattern, or same concept unless it is a weak area being intentionally revisited from a new angle.",
              "Use beginner/intermediate/advanced expectations for scoring.",
              "When mode is Real Interview, sound more concise and high-pressure.",
              "Always include followUpQuestion, strongerAnswer, interviewTips, mastery, strongTopics, weakTopics, and adaptiveReason.",
            ],
            requiredShape: fallback,
          }),
        },
      ],
    });

    const content = completion.choices[0]?.message.content;
    if (!content) return fallback;
    return normalizeResponse(JSON.parse(content) as Partial<InterviewResponse>, fallback, difficulty);
  } catch {
    return fallback;
  }
}

function fallbackInterviewTurn({
  technology,
  difficulty,
  mode,
  turns,
  askedQuestions,
  weakTopics,
  latestAnswer,
}: {
  analysis?: CareerAnalysis;
  technology: InterviewTechnology;
  difficulty: InterviewDifficulty;
  mode: InterviewMode;
  turns: InterviewTurn[];
  askedQuestions: AskedQuestionMemory[];
  weakTopics: string[];
  latestAnswer?: string;
}): InterviewResponse {
  const answeredTurns = turns.filter((turn) => turn.answer).length;
  const activeTurn = turns.at(-1);
  const feedback = latestAnswer ? evaluateAnswer(latestAnswer, technology, difficulty, activeTurn?.concept, activeTurn?.category) : undefined;
  const adaptive = chooseNextQuestion({ technology, difficulty, mode, answeredTurns, askedQuestions, weakTopics, feedback });
  const technicalScore = feedback ? Math.round((feedback.correctness + feedback.technicalDepth + feedback.problemSolvingQuality) / 3) : baseScoreForDifficulty(difficulty);
  const communicationScore = feedback ? Math.round((feedback.clarity + feedback.communicationQuality + feedback.confidence) / 3) : 58;
  const overallInterviewScore = Math.round(technicalScore * 0.62 + communicationScore * 0.28 + (feedback?.confidence ?? 55) * 0.1);
  const revisedWeakTopics = Array.from(new Set([...(feedback?.missingConcepts ?? []), ...weakTopics])).slice(0, 6);
  const strongTopics = buildStrongTopics(turns, feedback);

  return {
    feedback,
    nextQuestion: adaptive.question,
    followUpQuestion: adaptive.followUpQuestion,
    nextConcept: adaptive.concept,
    nextCategory: adaptive.category,
    nextDifficulty: adaptive.difficulty,
    adaptiveReason: adaptive.reason,
    overallInterviewScore,
    technicalScore,
    communicationScore,
    confidenceLevel: scoreLabel(feedback?.confidence ?? 55),
    recruiterImpression:
      overallInterviewScore >= 78
        ? "Strong interview signal. Keep answers concise, then invite deeper probing."
        : overallInterviewScore >= 62
          ? "Developing signal. You are close, but need sharper fundamentals and more precise examples."
          : "Risky signal. The interviewer would continue probing fundamentals before moving forward.",
    topicsToRevise: revisedWeakTopics.length ? revisedWeakTopics : [adaptive.concept, `${technology} fundamentals`],
    mistakesToAvoid: [
      "Answering with definitions only instead of decisions, tradeoffs, and examples.",
      "Skipping complexity, edge cases, failure modes, or production impact.",
      "Letting the answer ramble past the core point.",
    ],
    strongTopics,
    weakTopics: revisedWeakTopics,
    mastery: buildMastery(turns, feedback, adaptive.concept, revisedWeakTopics),
    readinessGrowth: Math.max(0, overallInterviewScore - 50),
    isComplete: answeredTurns >= (mode === "Real Interview" ? 7 : 5),
  };
}

function evaluateAnswer(
  answer: string,
  technology: InterviewTechnology,
  difficulty: InterviewDifficulty,
  concept = conceptMap[technology][0],
  category: TechnicalCategory = "Theory",
): InterviewFeedback {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const hasExample = /\b(for example|in my project|i built|i used|when|scenario|case)\b/i.test(answer);
  const hasTradeoff = /\b(tradeoff|because|however|depends|latency|memory|cost|scale|complexity|risk)\b/i.test(answer);
  const hasEdgeCase = /\b(edge|failure|error|null|empty|race|timeout|security|fallback|test)\b/i.test(answer);
  const hasMetric = /\d|%|o\(|big o|x\b/i.test(answer);
  const hasCodeSignal = /\b(function|class|query|select|join|api|component|hook|model|cache|queue|index)\b/i.test(answer);
  const concise = words >= 35 && words <= 180;
  const expected = difficulty === "Beginner" ? 44 : difficulty === "Intermediate" ? 58 : 70;

  const correctness = clamp(expected + (hasCodeSignal ? 14 : -8) + (hasExample ? 8 : 0) + (words >= 25 ? 8 : -10));
  const technicalDepth = clamp(expected + (hasTradeoff ? 15 : -6) + (hasEdgeCase ? 12 : 0) + (hasMetric ? 8 : 0) + (category === "Debugging" && hasEdgeCase ? 6 : 0));
  const clarity = clamp(45 + (concise ? 22 : 6) + (/\b(first|second|finally|step|then|so)\b/i.test(answer) ? 12 : 0));
  const communicationQuality = clamp((clarity + (hasExample ? 72 : 52) + (hasTradeoff ? 70 : 50)) / 3);
  const confidence = clamp(46 + (words >= 30 ? 12 : 0) + (hasExample ? 12 : 0) + (hasTradeoff ? 6 : 0));
  const problemSolvingQuality = clamp(expected + (hasEdgeCase ? 14 : -4) + (hasTradeoff ? 12 : 0) + (hasCodeSignal ? 9 : 0));
  const missingConcepts = [
    !hasTradeoff ? `${concept} tradeoffs` : "",
    !hasEdgeCase ? "edge cases and failure modes" : "",
    !hasMetric ? "complexity or measurable impact" : "",
  ].filter(Boolean);

  return {
    correctness,
    technicalDepth,
    clarity,
    communicationQuality,
    confidence,
    problemSolvingQuality,
    missingConcepts,
    strengths: [
      hasCodeSignal ? `You connected the answer to real ${technology} implementation details.` : "You addressed the question directly.",
      hasExample ? "You used an example, which makes the answer easier to trust." : "Your answer stayed focused enough to evaluate.",
    ],
    weaknesses: [
      hasTradeoff ? "The tradeoff is present, but it can be made more explicit." : "The answer needs the why: tradeoffs, alternatives, and constraints.",
      hasEdgeCase ? "Add one more production failure mode to strengthen it." : "Mention edge cases, debugging signals, or failure handling.",
    ],
    improvementSuggestions: [
      `Anchor the answer around ${concept}, then expand only where the interviewer probes.`,
      "Use a compact structure: definition, example, tradeoff, edge case.",
      difficulty === "Advanced" ? "Add scale, reliability, and performance implications." : "Close with a concrete example from code or a project.",
    ],
    strongerAnswer: buildStrongerAnswer(technology, concept, category),
    explanation: `${concept} matters because interviewers use it to test whether you can move from textbook knowledge to production decisions.`,
    interviewTips: [
      "State your assumption before solving.",
      "Name the tradeoff out loud.",
      "End with what you would test or monitor.",
    ],
    recruiterImpression:
      correctness >= 72 && technicalDepth >= 70
        ? "Recruiter-style feedback: this sounds credible and ready for deeper follow-up."
        : "Recruiter-style feedback: promising, but the answer needs more precision before it feels hire-ready.",
  };
}

function chooseNextQuestion({
  technology,
  difficulty,
  mode,
  answeredTurns,
  askedQuestions,
  weakTopics,
  feedback,
}: {
  technology: InterviewTechnology;
  difficulty: InterviewDifficulty;
  mode: InterviewMode;
  answeredTurns: number;
  askedQuestions: AskedQuestionMemory[];
  weakTopics: string[];
  feedback?: InterviewFeedback;
}) {
  const usedConcepts = new Set(askedQuestions.map((item) => item.concept.toLowerCase()));
  const weakConcept = weakTopics.find((topic) => conceptMap[technology].some((concept) => topic.toLowerCase().includes(concept.toLowerCase())));
  const shouldRevisitWeakness = Boolean(feedback && feedback.correctness < 62 && weakConcept);
  const concept =
    shouldRevisitWeakness && weakConcept
      ? weakConcept
      : conceptMap[technology].find((item) => !usedConcepts.has(item.toLowerCase())) ?? conceptMap[technology][answeredTurns % conceptMap[technology].length];
  const category = categoryByTurn[answeredTurns % categoryByTurn.length];
  const nextDifficulty = progressDifficulty(difficulty, answeredTurns, feedback);
  const pressurePrefix = mode === "Real Interview" ? "In a live interview, " : "";
  const question = buildQuestion(technology, concept, category, nextDifficulty, pressurePrefix);

  return {
    question: avoidDuplicateQuestion(question, askedQuestions, technology, concept, category, nextDifficulty, pressurePrefix),
    followUpQuestion: `If I pushed one level deeper on ${concept}, what failure mode or tradeoff would you discuss next?`,
    concept,
    category,
    difficulty: nextDifficulty,
    reason: shouldRevisitWeakness
      ? `Revisiting ${concept} from a different angle because your last answer showed a weak signal there.`
      : `Moving to ${concept} to broaden coverage without repeating prior question patterns.`,
  };
}

function buildQuestion(
  technology: InterviewTechnology,
  concept: string,
  category: TechnicalCategory,
  difficulty: InterviewDifficulty,
  pressurePrefix: string,
) {
  if (category === "Coding Concepts") {
    return `${pressurePrefix}explain how you would use ${concept} in ${technology}, including complexity or performance considerations.`;
  }
  if (category === "Scenario") {
    return `${pressurePrefix}imagine a production feature using ${technology} starts slowing down. How would you reason about ${concept} as a possible cause?`;
  }
  if (category === "Debugging") {
    return `${pressurePrefix}walk me through how you would debug a ${technology} issue related to ${concept}, step by step.`;
  }
  if (category === "Project Discussion") {
    return `${pressurePrefix}describe a project where ${concept} in ${technology} would matter. What design choice would you defend?`;
  }
  if (difficulty === "Advanced") {
    return `${pressurePrefix}teach me ${concept} in ${technology} at senior-engineer depth, including tradeoffs and edge cases.`;
  }
  return `${pressurePrefix}what is ${concept} in ${technology}, and when would you use it?`;
}

function avoidDuplicateQuestion(
  question: string,
  askedQuestions: AskedQuestionMemory[],
  technology: InterviewTechnology,
  concept: string,
  category: TechnicalCategory,
  difficulty: InterviewDifficulty,
  pressurePrefix: string,
) {
  const normalized = normalize(question);
  if (!askedQuestions.some((item) => normalize(item.question) === normalized)) return question;
  return `${pressurePrefix}give me a different practical example of ${concept} in ${technology}, then explain the main risk an interviewer should probe.`;
}

function progressDifficulty(difficulty: InterviewDifficulty, answeredTurns: number, feedback?: InterviewFeedback): InterviewDifficulty {
  if (difficulty === "Advanced") return "Advanced";
  if (!feedback) return difficulty;
  if (feedback.correctness >= 76 && feedback.technicalDepth >= 72 && answeredTurns >= 2) {
    return difficulty === "Beginner" ? "Intermediate" : "Advanced";
  }
  return difficulty;
}

function buildStrongerAnswer(technology: InterviewTechnology, concept: string, category: TechnicalCategory) {
  return `A stronger answer: "${concept} in ${technology} is useful when the constraint is clear. I would explain the core idea, show a small practical example, call out the main tradeoff, then mention how I would test edge cases. For a ${category.toLowerCase()} question, I would also connect it to production impact instead of stopping at the definition."`;
}

function buildStrongTopics(turns: InterviewTurn[], feedback?: InterviewFeedback) {
  const previous = turns
    .filter((turn) => turn.feedback && turn.feedback.correctness >= 72)
    .map((turn) => turn.concept ?? "technical communication");
  if (feedback && feedback.correctness >= 72) previous.push("latest answer");
  return Array.from(new Set(previous)).slice(0, 5);
}

function buildMastery(turns: InterviewTurn[], feedback: InterviewFeedback | undefined, nextConcept: string, weakTopics: string[]): TopicMastery[] {
  const scored = turns
    .filter((turn) => turn.feedback && turn.concept)
    .map((turn) => ({
      topic: turn.concept as string,
      score: turn.feedback?.correctness ?? 0,
      confidence: turn.feedback?.confidence ?? 0,
      attempts: 1,
      trend: ((turn.feedback?.correctness ?? 0) >= 70 ? "up" : "steady") as TopicMastery["trend"],
    }));

  if (feedback) {
    scored.push({
      topic: nextConcept,
      score: feedback.correctness,
      confidence: feedback.confidence,
      attempts: 1,
      trend: feedback.correctness >= 70 ? "up" : feedback.correctness < 55 ? "down" : "steady",
    });
  }

  weakTopics.slice(0, 4).forEach((topic) => {
    if (!scored.some((item) => item.topic === topic)) {
      scored.push({ topic, score: 46, confidence: 42, attempts: 1, trend: "down" });
    }
  });

  return scored.slice(-6);
}

function normalizeResponse(response: Partial<InterviewResponse>, fallback: InterviewResponse, difficulty: InterviewDifficulty): InterviewResponse {
  const nextCategory = technicalCategories.includes(response.nextCategory as TechnicalCategory) ? response.nextCategory as TechnicalCategory : fallback.nextCategory;
  const nextDifficulty = difficulties.includes(response.nextDifficulty as InterviewDifficulty) ? response.nextDifficulty as InterviewDifficulty : difficulty;
  return {
    ...fallback,
    ...response,
    nextQuestion: response.nextQuestion || fallback.nextQuestion,
    followUpQuestion: response.followUpQuestion || fallback.followUpQuestion,
    nextConcept: response.nextConcept || fallback.nextConcept,
    nextCategory,
    nextDifficulty,
    feedback: response.feedback ? { ...fallback.feedback, ...response.feedback } as InterviewFeedback : fallback.feedback,
    topicsToRevise: response.topicsToRevise?.length ? response.topicsToRevise : fallback.topicsToRevise,
    weakTopics: response.weakTopics?.length ? response.weakTopics : fallback.weakTopics,
    strongTopics: response.strongTopics?.length ? response.strongTopics : fallback.strongTopics,
    mastery: response.mastery?.length ? response.mastery : fallback.mastery,
  };
}

function compactInterviewProfile(analysis: CareerAnalysis) {
  return {
    targetRole: analysis.targetRole,
    readinessScore: analysis.readinessScore,
    missingSkills: analysis.missingSkills,
    projects: analysis.extractedResume.projects,
    github: analysis.github,
    roadmap: analysis.roadmap,
  };
}

function baseScoreForDifficulty(difficulty: InterviewDifficulty) {
  if (difficulty === "Advanced") return 62;
  if (difficulty === "Intermediate") return 56;
  return 50;
}

function scoreLabel(score: number) {
  if (score >= 78) return "Interview-ready";
  if (score >= 62) return "Developing";
  return "Needs reps";
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function clamp(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}
