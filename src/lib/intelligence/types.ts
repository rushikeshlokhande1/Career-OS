export type RecruiterPersona = "startup" | "faang" | "hr";

export type ExtractedResume = {
  rawText: string;
  contactSignals: string[];
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  achievements: string[];
  links: string[];
};

export type ScoreBreakdown = {
  resumeQuality: number;
  projectQuality: number;
  skillsRelevance: number;
  deploymentExperience: number;
  githubActivity: number;
  technicalDepth: number;
  communicationQuality: number;
};

export type AtsReport = {
  score: number;
  keywordMatch: number;
  formatScore: number;
  proofScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  fixes: string[];
  verdict: string;
};

export type GitHubRepositorySignal = {
  name: string;
  description: string | null;
  url?: string;
  homepage?: string | null;
  language: string | null;
  stars: number;
  forks: number;
  updatedAt: string;
  hasReadme: boolean;
  hasDeploySignal?: boolean;
  hasTestSignal?: boolean;
  complexitySignals: string[];
};

export type GitHubIntelligence = {
  username: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  commitConsistency: number;
  readmeQuality: number;
  repositoryQuality: number;
  techStackDiversity: string[];
  realWorldComplexity: number;
  portfolioStrength: number;
  repositories: GitHubRepositorySignal[];
  insights: string[];
};

export type DailyMission = {
  title: string;
  impact: string;
  difficulty: "Low" | "Medium" | "High";
  estimatedMinutes: number;
};

export type CareerRoadmapItem = {
  phase: string;
  title: string;
  goal: string;
  proof: string;
  progress: number;
};

export type CareerTwin = {
  careerArchetype: string;
  learningStyle: string;
  executionPattern: string;
  technicalPersonality: string;
  communicationStyle: string;
  growthPotential: number;
  readinessTier: string;
  industryAlignment: string;
  topStrengths: string[];
  topWeaknesses: string[];
  riskAreas: string[];
  recruiterPerceptionSummary: string;
  emotionalSummary: string;
  futureSimulations: Array<{
    title: string;
    prediction: string;
    days: number;
    probabilityDelta: number;
  }>;
  growthForecast: Array<{
    stage: string;
    level: number;
    focus: string;
    timeline: string;
  }>;
  skillExpansionTimeline: Array<{
    skill: string;
    current: number;
    predicted: number;
    timeline: string;
  }>;
  careerMomentum: number;
};

export type HireReadySprintDay = {
  day: number;
  title: string;
  objective: string;
  task: string;
  tool: "Resume" | "GitHub" | "Project" | "Skills" | "Interview" | "Assistant";
  outcome: string;
  difficulty: "Low" | "Medium" | "High";
};

export type HireReadySprint = {
  verdict: string;
  brutalTruth: string;
  fastestPath: string;
  daysToImprove: number;
  projectedReadinessGain: number;
  projectedHiringGain: number;
  sprintDays: HireReadySprintDay[];
};

export type CareerAnalysis = {
  id: string;
  createdAt: string;
  persona: RecruiterPersona;
  targetRole: string;
  jobDescription?: string;
  extractedResume: ExtractedResume;
  scoreBreakdown: ScoreBreakdown;
  atsReport?: AtsReport;
  readinessScore: number;
  confidenceIndex: number;
  hiringProbability: number;
  careerSummary: string;
  recruiterSimulation: {
    verdict: string;
    noticedFirst: string[];
    rejectionRisks: string[];
    profileWeaknesses: string[];
    hiringBoosters: string[];
    personaFeedback: Record<RecruiterPersona, string>;
  };
  missingSkills: Array<{ skill: string; severity: number; whyItMatters: string }>;
  recommendedProjects: Array<{ title: string; outcome: string; stack: string[] }>;
  roadmap: CareerRoadmapItem[];
  interviewPreparation: string[];
  dailyMissions: DailyMission[];
  recruiterAlerts: string[];
  trendingIndustrySkills: string[];
  personalizedInsights: string[];
  careerTwin: CareerTwin;
  hireReadySprint: HireReadySprint;
  github?: GitHubIntelligence;
};
