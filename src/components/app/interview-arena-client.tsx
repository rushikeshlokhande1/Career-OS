"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  Clock3,
  Flame,
  Gauge,
  Loader2,
  Mic,
  Play,
  Send,
  Target,
  Trophy,
  UserRound,
  Volume2,
} from "lucide-react";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { readApiJson } from "@/lib/api-response";
import { loadInterviewProgress, loadLatestAnalysis, saveInterviewResult, type InterviewProgress } from "@/lib/intelligence/client-store";
import type {
  AskedQuestionMemory,
  InterviewDifficulty,
  InterviewMode,
  InterviewResponse,
  InterviewTechnology,
  InterviewTurn,
} from "@/lib/intelligence/interview";

const technologies: InterviewTechnology[] = [
  "Python",
  "Java",
  "SQL",
  "JavaScript",
  "React",
  "Machine Learning",
  "Data Structures",
  "System Design",
  "Cloud Computing",
];

const difficulties: InterviewDifficulty[] = ["Beginner", "Intermediate", "Advanced"];
const sessionMinutes: Record<InterviewMode, number> = { Training: 18, "Real Interview": 12 };

export function InterviewArenaClient() {
  const [technology, setTechnology] = useState<InterviewTechnology>("React");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("Intermediate");
  const [mode, setMode] = useState<InterviewMode>("Training");
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<AskedQuestionMemory[]>([]);
  const [answer, setAnswer] = useState("");
  const [lastResult, setLastResult] = useState<InterviewResponse | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [interviewError, setInterviewError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(sessionMinutes.Training * 60);
  const [progress, setProgress] = useState<InterviewProgress>({ completed: 0, streak: 0, bestScore: 0, weakTopics: [] });
  const [analysis, setAnalysis] = useState<unknown>(null);

  useEffect(() => {
    setProgress(loadInterviewProgress());
    setAnalysis(loadLatestAnalysis());
  }, []);

  useEffect(() => {
    if (!isLive || lastResult?.isComplete) return;
    const interval = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [isLive, lastResult?.isComplete]);

  useEffect(() => {
    if (secondsLeft !== 0 || !isLive || lastResult?.isComplete) return;
    setLastResult((current) =>
      current ? { ...current, isComplete: true, recruiterImpression: "Time is up. Review your feedback, then start a new round." } : current,
    );
  }, [isLive, lastResult?.isComplete, secondsLeft]);

  useEffect(() => {
    const activeQuestion = turns.at(-1)?.question;
    if (!voiceEnabled || !activeQuestion || isThinking || lastResult?.isComplete) return;
    speakQuestion(activeQuestion);
  }, [turns, isThinking, lastResult?.isComplete, voiceEnabled]);

  const activeTurn = turns.at(-1);
  const completedAnswers = turns.filter((turn) => turn.answer).length;
  const latestFeedback = [...turns].reverse().find((turn) => turn.feedback)?.feedback;
  const weakTopics = useMemo(() => lastResult?.weakTopics ?? progress.weakTopics ?? [], [lastResult?.weakTopics, progress.weakTopics]);
  const averageScore = useMemo(() => {
    const scored = turns.map((turn) => turn.feedback?.correctness).filter((score): score is number => typeof score === "number");
    if (!scored.length) return 0;
    return Math.round(scored.reduce((total, score) => total + score, 0) / scored.length);
  }, [turns]);
  const score = lastResult?.overallInterviewScore ?? averageScore;

  async function startInterview() {
    setIsLive(true);
    setTurns([]);
    setAskedQuestions([]);
    setLastResult(null);
    setAnswer("");
    setSpeechError("");
    setInterviewError("");
    setSecondsLeft(sessionMinutes[mode] * 60);
    setIsThinking(true);

    try {
      const result = await callInterviewApi([], []);
      setLastResult(result);
      setTurns([turnFromResult(result)]);
      setAskedQuestions([memoryFromResult(result)]);
    } catch {
      setIsLive(false);
      setInterviewError("Could not start the interview. Please try again.");
    } finally {
      setIsThinking(false);
    }
  }

  async function submitAnswer() {
    const trimmed = answer.trim();
    if (!trimmed || !activeTurn || isThinking || lastResult?.isComplete) return;

    const answeredTurns = turns.map((turn, index) => (index === turns.length - 1 ? { ...turn, answer: trimmed } : turn));
    setTurns(answeredTurns);
    setAnswer("");
    setInterviewError("");
    setIsThinking(true);

    let result: InterviewResponse;
    try {
      result = await callInterviewApi(answeredTurns, askedQuestions, trimmed);
    } catch {
      setTurns(turns);
      setAnswer(trimmed);
      setInterviewError("I could not evaluate that answer. Try submitting again.");
      setIsThinking(false);
      return;
    }

    const withFeedback = answeredTurns.map((turn, index) => (index === answeredTurns.length - 1 ? { ...turn, feedback: result.feedback } : turn));
    setLastResult(result);
    setIsThinking(false);

    if (result.isComplete) {
      setTurns(withFeedback);
      setProgress(saveInterviewResult(result.overallInterviewScore, result.topicsToRevise, technology));
      return;
    }

    setTurns([...withFeedback, turnFromResult(result)]);
    setAskedQuestions((current) => [...current, memoryFromResult(result)]);
  }

  async function callInterviewApi(currentTurns: InterviewTurn[], memory: AskedQuestionMemory[], latestAnswer?: string) {
    const response = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysis,
        technology,
        difficulty,
        mode,
        turns: currentTurns,
        askedQuestions: memory,
        weakTopics,
        latestAnswer,
      }),
    });
    const payload = await readApiJson<InterviewResponse>(response);
    if (!response.ok || !payload.nextQuestion) throw new Error(payload.error ?? "Interview failed");
    return payload;
  }

  function startListening() {
    const SpeechRecognition =
      (window as unknown as SpeechWindow).SpeechRecognition ?? (window as unknown as SpeechWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Voice input is not available in this browser. You can type your answer.");
      return;
    }

    setSpeechError("");
    window.speechSynthesis?.cancel();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";
    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? "";
        if (event.results[index].isFinal) finalTranscript += `${transcript} `;
        else interimTranscript += transcript;
      }
      setAnswer(`${finalTranscript}${interimTranscript}`.trim());
    };
    recognition.onerror = () => {
      setIsListening(false);
      setSpeechError("I could not hear that clearly. Try again or type the answer.");
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    setIsListening(true);
  }

  return (
    <DashboardShell active="Interview Practice">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
        <section className="rounded-xl border border-border bg-card p-5 shadow-panel">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-teal-200/20 bg-teal-300/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-teal-100">
                <Bot className="h-4 w-4" />
                Interview Practice
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-normal text-card-foreground">Practice one question at a time.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Pick a topic, answer in your own words, and get clear AI feedback after each response.
              </p>
            </div>
            <div className="grid w-full grid-cols-3 gap-3 sm:w-auto">
              <MiniStat icon={<Trophy className="h-4 w-4" />} label="Best" value={`${progress.bestScore}`} />
              <MiniStat icon={<Flame className="h-4 w-4" />} label="Streak" value={`${progress.streak}`} />
              <MiniStat icon={<Gauge className="h-4 w-4" />} label="Score" value={`${score || 0}`} />
            </div>
          </div>
        </section>

        <SetupPanel
          technology={technology}
          difficulty={difficulty}
          mode={mode}
          isLive={isLive}
          isThinking={isThinking}
          secondsLeft={secondsLeft}
          completedAnswers={completedAnswers}
          voiceEnabled={voiceEnabled}
          onTechnologyChange={setTechnology}
          onDifficultyChange={setDifficulty}
          onModeChange={setMode}
          onStart={() => void startInterview()}
          onToggleVoice={() => setVoiceEnabled((current) => !current)}
        />

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="overflow-hidden">
            {!isLive ? (
              <EmptyInterview onStart={() => void startInterview()} isThinking={isThinking} />
            ) : (
              <div className="space-y-5 p-5">
                <QuestionCard turn={activeTurn} isThinking={isThinking} questionNumber={completedAnswers + 1} />

                {!lastResult?.isComplete ? (
                  <AnswerBox
                    answer={answer}
                    isThinking={isThinking}
                    isListening={isListening}
                    secondsLeft={secondsLeft}
                    speechError={speechError}
                    interviewError={interviewError}
                    onAnswerChange={setAnswer}
                    onListen={startListening}
                    onSubmit={() => void submitAnswer()}
                    onClear={() => setAnswer("")}
                  />
                ) : (
                  <CompletionPanel result={lastResult} />
                )}

                {latestFeedback ? <LatestFeedback feedback={latestFeedback} /> : null}
              </div>
            )}
          </Card>

          <FeedbackPanel
            result={lastResult}
            score={score}
            completedAnswers={completedAnswers}
            weakTopics={weakTopics}
          />
        </div>
      </div>
    </DashboardShell>
  );
}

function SetupPanel({
  technology,
  difficulty,
  mode,
  isLive,
  isThinking,
  secondsLeft,
  completedAnswers,
  voiceEnabled,
  onTechnologyChange,
  onDifficultyChange,
  onModeChange,
  onStart,
  onToggleVoice,
}: {
  technology: InterviewTechnology;
  difficulty: InterviewDifficulty;
  mode: InterviewMode;
  isLive: boolean;
  isThinking: boolean;
  secondsLeft: number;
  completedAnswers: number;
  voiceEnabled: boolean;
  onTechnologyChange: (technology: InterviewTechnology) => void;
  onDifficultyChange: (difficulty: InterviewDifficulty) => void;
  onModeChange: (mode: InterviewMode) => void;
  onStart: () => void;
  onToggleVoice: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-white/35">Technology</div>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:flex xl:flex-wrap">
              {technologies.map((item) => (
                <button
                  key={item}
                  onClick={() => onTechnologyChange(item)}
                  className={`min-w-0 rounded-lg border px-3 py-2 text-sm transition ${
                    technology === item
                      ? "border-teal-200/50 bg-teal-300/15 text-white"
                      : "border-white/10 bg-white/[0.035] text-white/55 hover:text-white"
                  }`}
                >
                  <span className="block truncate">{item}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <SegmentedControl
              label="Difficulty"
              value={difficulty}
              options={difficulties}
              onChange={(value) => onDifficultyChange(value as InterviewDifficulty)}
            />
            <SegmentedControl
              label="Mode"
              value={mode}
              options={["Training", "Real Interview"]}
              onChange={(value) => onModeChange(value as InterviewMode)}
            />
          </div>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(4,auto)] lg:items-center xl:grid-cols-[repeat(3,auto)]">
          <Status icon={<Clock3 className="h-4 w-4" />} label="Time" value={formatTime(secondsLeft)} />
          <Status icon={<Target className="h-4 w-4" />} label="Answers" value={`${completedAnswers}`} />
          <div className="flex min-w-0 gap-2 sm:col-span-2 lg:col-span-2 xl:col-span-1">
            <Button className="flex-1 xl:flex-none" onClick={onStart} disabled={isThinking}>
              {isThinking && !isLive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isLive ? "Restart" : "Start"}
            </Button>
            <Button className="flex-1 xl:flex-none" type="button" variant="secondary" onClick={onToggleVoice}>
              <Volume2 className="h-4 w-4" />
              {voiceEnabled ? "Voice on" : "Voice off"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SegmentedControl({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className={`grid gap-2 rounded-lg border border-white/10 bg-black/20 p-1 ${options.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-md px-2 py-2 text-xs font-medium transition ${
              value === option ? "bg-teal-300 text-slate-950" : "text-white/55 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuestionCard({ turn, isThinking, questionNumber }: { turn?: InterviewTurn; isThinking: boolean; questionNumber: number }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-teal-200/20 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-teal-200/25 bg-teal-300/10">
            {isThinking ? <Loader2 className="h-5 w-5 animate-spin text-teal-200" /> : <Bot className="h-5 w-5 text-teal-200" />}
          </div>
          <div>
            <div className="text-sm font-medium text-card-foreground">Question {questionNumber}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {turn?.difficulty ?? "Adaptive"} | {turn?.concept ?? "Preparing"}
            </div>
          </div>
        </div>
        <span className="w-fit rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          {turn?.category ?? "Technical"}
        </span>
      </div>
      <p className="mt-5 text-2xl font-semibold leading-9 tracking-normal text-card-foreground">
        {isThinking ? <TypingText /> : formatQuestion(turn?.question ?? "Preparing your question")}
      </p>
    </motion.section>
  );
}

function AnswerBox({
  answer,
  isThinking,
  isListening,
  secondsLeft,
  speechError,
  interviewError,
  onAnswerChange,
  onListen,
  onSubmit,
  onClear,
}: {
  answer: string;
  isThinking: boolean;
  isListening: boolean;
  secondsLeft: number;
  speechError: string;
  interviewError: string;
  onAnswerChange: (answer: string) => void;
  onListen: () => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <UserRound className="h-4 w-4 text-teal-200" />
          Your answer
        </div>
        <Button type="button" variant="secondary" onClick={onListen} disabled={isListening || isThinking}>
          {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          {isListening ? "Listening" : "Speak"}
        </Button>
      </div>
      <textarea
        value={answer}
        onChange={(event) => onAnswerChange(event.target.value)}
        placeholder="Type your answer here. Keep it simple: explain the idea, give one example, mention a tradeoff."
        className="min-h-56 w-full resize-none rounded-lg border border-input bg-background p-4 text-base leading-7 text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-teal-200/50"
      />
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-md border border-border bg-muted px-2 py-1">Idea</span>
        <span className="rounded-md border border-border bg-muted px-2 py-1">Example</span>
        <span className="rounded-md border border-border bg-muted px-2 py-1">Tradeoff</span>
      </div>
      {speechError ? <p className="mt-3 text-sm text-amber-200">{speechError}</p> : null}
      {interviewError ? <p className="mt-3 text-sm text-amber-200">{interviewError}</p> : null}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button className="sm:min-w-48" onClick={onSubmit} disabled={!answer.trim() || isThinking || secondsLeft === 0}>
          {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit answer
        </Button>
        <Button type="button" variant="secondary" onClick={onClear} disabled={!answer || isThinking}>
          Clear
        </Button>
      </div>
    </section>
  );
}

function FeedbackPanel({
  result,
  score,
  completedAnswers,
  weakTopics,
}: {
  result: InterviewResponse | null;
  score: number;
  completedAnswers: number;
  weakTopics: string[];
}) {
  return (
    <aside className="grid min-w-0 gap-5 lg:grid-cols-3 xl:block xl:space-y-5">
      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <Gauge className="h-4 w-4 text-teal-200" />
          Feedback
        </div>
        <div className="mt-4 text-5xl font-semibold gradient-text">{score || 0}</div>
        <Progress value={score} className="mt-4 h-3" />
        <div className="mt-4 grid gap-3">
          <Info label="Correctness" value={`${result?.feedback?.correctness ?? 0}/100`} />
          <Info label="Depth" value={`${result?.feedback?.technicalDepth ?? result?.technicalScore ?? 0}/100`} />
          <Info label="Answers" value={`${completedAnswers}`} />
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-medium text-card-foreground">Tips for next answer</div>
        <div className="mt-3 space-y-2">
          {(result?.feedback?.interviewTips ?? ["Explain the idea.", "Give one example.", "Mention one tradeoff."]).slice(0, 3).map((item) => (
            <p key={item} className="rounded-lg border border-border bg-muted/60 p-3 text-sm leading-5 text-muted-foreground">
              {item}
            </p>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-medium text-card-foreground">Practice next</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(weakTopics.length ? weakTopics : ["tradeoffs", "edge cases", "complexity"]).slice(0, 5).map((topic) => (
            <span key={topic} className="rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
              {topic}
            </span>
          ))}
        </div>
      </Card>
    </aside>
  );
}

function LatestFeedback({ feedback }: { feedback: NonNullable<InterviewTurn["feedback"]> }) {
  return (
    <section className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
        <CheckCircle2 className="h-4 w-4 text-teal-200" />
        Last feedback
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{feedback.recruiterImpression}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <FeedbackList title="Improve" items={feedback.improvementSuggestions.slice(0, 2)} />
        <FeedbackList title="Better answer" items={[feedback.strongerAnswer]} />
      </div>
    </section>
  );
}

function EmptyInterview({ onStart, isThinking }: { onStart: () => void; isThinking: boolean }) {
  return (
    <div className="grid min-h-[520px] place-items-center p-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl border border-teal-200/25 bg-teal-300/10">
          <Bot className="h-7 w-7 text-teal-200" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-card-foreground">Ready when you are.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Choose a technology, press Start, and answer the first question. Feedback appears after you submit.
        </p>
        <Button className="mt-5" onClick={onStart} disabled={isThinking}>
          {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Start practice
        </Button>
      </div>
    </div>
  );
}

function CompletionPanel({ result }: { result: InterviewResponse }) {
  return (
    <section className="rounded-xl border border-teal-200/20 bg-teal-300/10 p-5">
      <div className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
        <CheckCircle2 className="h-5 w-5 text-teal-200" />
        Interview complete
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.recruiterImpression}</p>
      <div className="mt-4">
        <FeedbackList title="Revise next" items={result.topicsToRevise.slice(0, 3)} />
      </div>
    </section>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-20 rounded-lg border border-border bg-muted/60 p-3 text-center">
      <div className="mx-auto text-teal-200">{icon}</div>
      <div className="mt-2 text-xl font-semibold text-card-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Status({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/60 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-teal-200">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-card-foreground">{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-card-foreground">{value}</div>
    </div>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-sm font-medium text-card-foreground">{title}</div>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-lg border border-border bg-muted/50 p-2 text-xs leading-5 text-muted-foreground">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function TypingText() {
  return (
    <span className="inline-flex items-center gap-2">
      Thinking
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-200" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-200 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-200 [animation-delay:300ms]" />
      </span>
    </span>
  );
}

function turnFromResult(result: InterviewResponse): InterviewTurn {
  return {
    question: result.nextQuestion,
    concept: result.nextConcept,
    category: result.nextCategory,
    difficulty: result.nextDifficulty,
  };
}

function memoryFromResult(result: InterviewResponse): AskedQuestionMemory {
  return {
    question: result.nextQuestion,
    concept: result.nextConcept,
    category: result.nextCategory,
    difficulty: result.nextDifficulty,
  };
}

function formatQuestion(question: string) {
  const trimmed = question.trim();
  if (!trimmed) return "Preparing your interview question...";
  return /[?.!]$/.test(trimmed) ? trimmed : `${trimmed}?`;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function speakQuestion(question: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(question);
  utterance.rate = 0.96;
  utterance.pitch = 0.92;
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
}

type SpeechWindow = {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type SpeechRecognitionConstructor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
};
