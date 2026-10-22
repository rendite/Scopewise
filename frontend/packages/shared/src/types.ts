// Mirrors docs/API.md. Change both together.

export type ProjectType = "website" | "webshop" | "webapp" | "mobileApp" | "custom";

export const projectTypeLabels: Record<ProjectType, string> = {
  website: "Website",
  webshop: "Online shop",
  webapp: "Web app",
  mobileApp: "Mobile app",
  custom: "Custom software",
};

export type SurveyStatus = "draft" | "sent" | "inProgress" | "completed";

export interface Branding {
  agencyName: string;
  logoUrl: string | null;
  primaryColor: string;
}

export interface Question {
  id: string;
  text: string;
  hint: string | null;
}

export interface BriefingSection {
  key: "goals" | "audience" | "scope" | "design" | "content" | "technical" | "budgetTimeline";
  title: string;
  items: string[];
}

export interface Briefing {
  summary: string;
  sections: BriefingSection[];
  openQuestions: string[];
}

// Public survey

export interface PublicSurvey {
  clientName: string;
  projectType: ProjectType;
  status: SurveyStatus;
  branding: Branding;
}

export interface TurnResponse {
  question: Question | null;
  progress: number;
  done: boolean;
}

export interface AnswerRequest {
  questionId: string;
  answer: string;
}

// Dashboard

export interface User {
  id: string;
  email: string;
  agencyName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  agencyName: string;
}

export interface CreateSurveyRequest {
  clientName: string;
  clientEmail: string | null;
  projectType: ProjectType;
}

export interface SurveySummary {
  id: string;
  clientName: string;
  projectType: ProjectType;
  status: SurveyStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface SurveyDetail extends SurveySummary {
  clientEmail: string | null;
  link: string;
  briefing: Briefing | null;
}
