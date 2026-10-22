// In-memory stand-in for the dashboard endpoints. Any email/password logs in.
import type { DashboardApi } from "../dashboard.ts";
import { ApiError, delay } from "../http.ts";
import type { Branding, Briefing, SurveyDetail, User } from "../types.ts";

const surveyBaseUrl = "http://localhost:5174/s/";

const sampleBriefing: Briefing = {
  summary:
    "Family bakery with two shops in Munich wants a modern website that lets customers pre-order cakes online and shows the daily menu.",
  sections: [
    {
      key: "goals",
      title: "Goals",
      items: [
        "Take cake pre-orders online instead of by phone",
        "Look more professional than local competitors",
      ],
    },
    {
      key: "audience",
      title: "Audience",
      items: ["Local families (30–55)", "Offices ordering catering for meetings"],
    },
    {
      key: "scope",
      title: "Pages & features",
      items: [
        "Home",
        "Daily menu",
        "Cake pre-order form with pickup date",
        "About us",
        "Contact & opening hours",
      ],
    },
    {
      key: "design",
      title: "Design",
      items: ["Warm, handmade feel", "Likes the style of bakery websites with large food photos"],
    },
    {
      key: "content",
      title: "Content",
      items: [
        "Has logo and brand colours",
        "Needs a photographer for product photos",
        "Owner writes texts",
      ],
    },
    {
      key: "technical",
      title: "Technical",
      items: [
        "Online payment not required at first",
        "Owner must be able to update the menu daily",
      ],
    },
    {
      key: "budgetTimeline",
      title: "Budget & timeline",
      items: ["€4,000–6,000", "Live before Christmas season (end of November)"],
    },
  ],
  openQuestions: ["Domain: do they own bakery-mueller.de already?"],
};

export function createMockDashboardApi(): DashboardApi {
  let user: User | null = null;
  let branding: Branding = { agencyName: "Pixel & Co", logoUrl: null, primaryColor: "#3F5EFB" };
  let nextId = 4;

  const surveys: SurveyDetail[] = [
    {
      id: "3",
      clientName: "Yoga Studio Lotus",
      clientEmail: null,
      projectType: "webapp",
      status: "sent",
      createdAt: "2026-10-21T09:12:00Z",
      completedAt: null,
      link: `${surveyBaseUrl}lotus-7f3a`,
      briefing: null,
    },
    {
      id: "2",
      clientName: "Weber Autohaus",
      clientEmail: "info@weber-autohaus.example",
      projectType: "website",
      status: "inProgress",
      createdAt: "2026-10-19T14:40:00Z",
      completedAt: null,
      link: `${surveyBaseUrl}weber-91bc`,
      briefing: null,
    },
    {
      id: "1",
      clientName: "Bakery Müller",
      clientEmail: "hello@bakery-mueller.example",
      projectType: "website",
      status: "completed",
      createdAt: "2026-10-14T08:05:00Z",
      completedAt: "2026-10-15T18:22:00Z",
      link: `${surveyBaseUrl}demo`,
      briefing: sampleBriefing,
    },
  ];

  const requireUser = () => {
    if (!user) throw new ApiError(401, "Please log in.");
  };

  const find = (id: string) => {
    const survey = surveys.find((s) => s.id === id);
    if (!survey) throw new ApiError(404, "Survey not found.");
    return survey;
  };

  return {
    async register({ email, agencyName }) {
      await delay(500);
      user = { id: "u1", email, agencyName };
      branding = { ...branding, agencyName };
      return user;
    },
    async login({ email }) {
      await delay(500);
      user = { id: "u1", email, agencyName: branding.agencyName };
      return user;
    },
    async logout() {
      await delay(200);
      user = null;
    },
    async me() {
      await delay(200);
      return user;
    },

    async listSurveys() {
      await delay(400);
      requireUser();
      return surveys.map(({ id, clientName, projectType, status, createdAt, completedAt }) => ({
        id,
        clientName,
        projectType,
        status,
        createdAt,
        completedAt,
      }));
    },
    async createSurvey(body) {
      await delay(600);
      requireUser();
      const id = String(nextId++);
      const survey: SurveyDetail = {
        ...body,
        id,
        status: "sent",
        createdAt: new Date().toISOString(),
        completedAt: null,
        link: `${surveyBaseUrl}${crypto.randomUUID().slice(0, 8)}`,
        briefing: null,
      };
      surveys.unshift(survey);
      return survey;
    },
    async getSurvey(id) {
      await delay(300);
      requireUser();
      return find(id);
    },
    async deleteSurvey(id) {
      await delay(300);
      requireUser();
      surveys.splice(surveys.indexOf(find(id)), 1);
    },

    async getBranding() {
      await delay(200);
      requireUser();
      return branding;
    },
    async updateBranding(body) {
      await delay(400);
      requireUser();
      branding = body;
      return branding;
    },
  };
}
