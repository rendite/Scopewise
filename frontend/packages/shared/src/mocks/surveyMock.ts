// In-memory stand-in for the public survey endpoints. It follows a fixed
// script, but reacts a little to answers so the UI can be tested with
// realistic flow and latency. Special tokens: "notfound" → 404, "completed" → done.
import { ApiError, delay } from "../http.ts";
import type { SurveyApi } from "../survey.ts";
import type { PublicSurvey, Question, TurnResponse } from "../types.ts";

const script: Omit<Question, "id">[] = [
  {
    text: "To start simple: what does your business do, in one or two sentences?",
    hint: "For example: “We are a family bakery in Munich with two shops.”",
  },
  {
    text: "What should the new website achieve for you?",
    hint: "More orders, more trust, less phone calls… anything goes.",
  },
  {
    text: "Who are the people you most want to reach with it?",
    hint: null,
  },
  {
    text: "When someone visits your site for the first time, what is the one thing they should do?",
    hint: "For example: call you, book a table, buy something, sign up.",
  },
  {
    text: "Which pages or sections do you already have in mind?",
    hint: "A rough list is perfect, like: home, about us, menu, contact.",
  },
  {
    text: "Are there websites you like the look or feel of? What do you like about them?",
    hint: "Links or just names are fine.",
  },
  {
    text: "Do you already have a logo, colours or photos we should use?",
    hint: null,
  },
  {
    text: "Who will write the texts and keep the content up to date later on?",
    hint: null,
  },
  {
    text: "Should visitors be able to do anything special, such as booking, paying or logging in?",
    hint: null,
  },
  {
    text: "Is there a date by which the website needs to be live?",
    hint: "An event, a season, an opening…",
  },
  {
    text: "Last one: what budget range did you have in mind?",
    hint: "A rough range helps the agency suggest the right solution.",
  },
];

interface Session {
  index: number;
  answers: string[];
}

export function createMockSurveyApi(): SurveyApi {
  const sessions = new Map<string, Session>();

  const surveyFor = (token: string): PublicSurvey => {
    if (token === "notfound") {
      throw new ApiError(404, "This survey link is not valid.");
    }
    return {
      clientName: "Bakery Müller",
      projectType: "website",
      status: token === "completed" ? "completed" : "sent",
      branding: { agencyName: "Pixel & Co", logoUrl: null, primaryColor: "#3F5EFB" },
    };
  };

  const turn = (session: Session): TurnResponse => {
    const next = script[session.index];
    if (!next) {
      return { question: null, progress: 1, done: true };
    }
    let text = next.text;
    // A tiny bit of "adaptivity" so the mock feels like a conversation.
    const previous = session.answers.at(-1)?.toLowerCase() ?? "";
    if (session.index === 2 && previous.includes("order")) {
      text = "Orders, great. Who are the customers you most want to win online?";
    }
    return {
      question: { id: `q_${session.index + 1}`, text, hint: next.hint },
      progress: session.index / script.length,
      done: false,
    };
  };

  return {
    async getSurvey(token) {
      await delay(400);
      return surveyFor(token);
    },

    async start(token) {
      await delay(900);
      surveyFor(token);
      let session = sessions.get(token);
      if (!session) {
        session = { index: 0, answers: [] };
        sessions.set(token, session);
      }
      return turn(session);
    },

    async answer(token, { questionId, answer }) {
      await delay(1200 + Math.random() * 1200);
      const session = sessions.get(token);
      if (!session) {
        throw new ApiError(409, "Survey has not been started.");
      }
      if (questionId !== `q_${session.index + 1}`) {
        throw new ApiError(409, "This question was already answered.");
      }
      session.answers.push(answer);
      session.index += 1;
      return turn(session);
    },
  };
}
