export const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

export const API_ROUTES = {
  chat: "/api/chat",
  health: "/api/health",
} as const;

export const HTTP_STATUS_SERVICE_UNAVAILABLE = 503;

export const CHAT_DEFAULT_TOP_K = 8;
export const CHAT_HISTORY_WINDOW = 20;
export const CONVERSATION_TITLE_PREVIEW_LENGTH = 40;
export const RANDOM_ID_SLICE_START = 2;
export const RANDOM_ID_SLICE_END = 10;

export const SOURCES_TEXT_PREVIEW_LENGTH = 300;
export const MESSAGE_LIST_AUTOSCROLL_DELAY_MS = 120;

export const SUGGESTION_PROMPTS = [
  "What forms do I need for rental income?",
  "How do I report stock sales on my taxes?",
  "What is a Schedule K-1 and when do I need it?",
  "Can I deduct home office expenses as a contractor?",
] as const;

export const BACKEND_UNREACHABLE_ERROR_MESSAGE =
  "Could not reach the Python backend. Make sure it is running on port 8000.";
