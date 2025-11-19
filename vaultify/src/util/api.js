export const API_BASE = import.meta.env.PROD
  ? "http://localhost:5000/api" // backend in production
  : "/api"; // proxy in development
