import { getServerAuthSession } from "@/src/server/auth";
import { type NextApiRequest, type NextApiResponse } from "next";

const DEFAULT_EVAL_SERVICE_URL = "http://eval-service:8765";

function getPathSegments(req: NextApiRequest): string[] {
  const rawPath = req.query.path;
  if (!Array.isArray(rawPath)) return [];
  return rawPath.filter((segment) => segment.length > 0);
}

function isSafeSegment(segment: string): boolean {
  return /^[A-Za-z0-9_.:-]+$/.test(segment);
}

function resolveTargetPath(segments: string[]): string | null {
  if (segments.length === 1 && segments[0] === "health") return "/health";

  if (segments.length === 1 && segments[0] === "suites") {
    return "/api/eval/suites";
  }

  if (segments.length === 1 && segments[0] === "runs") {
    return "/api/eval/runs";
  }

  if (segments.length === 2 && segments[0] === "runs") {
    return `/api/eval/runs/${encodeURIComponent(segments[1])}`;
  }

  if (
    segments.length === 3 &&
    segments[0] === "runs" &&
    ["trials", "events", "artifacts"].includes(segments[2])
  ) {
    return `/api/eval/runs/${encodeURIComponent(segments[1])}/${segments[2]}`;
  }

  if (segments.length === 2 && segments[0] === "trials") {
    return `/api/eval/trials/${encodeURIComponent(segments[1])}`;
  }

  if (
    segments.length === 3 &&
    segments[0] === "trials" &&
    segments[2] === "human-eval"
  ) {
    return `/api/eval/trials/${encodeURIComponent(segments[1])}/human-eval`;
  }

  if (segments.length === 2 && segments[0] === "artifacts") {
    return `/api/eval/artifacts/${encodeURIComponent(segments[1])}`;
  }

  return null;
}

function copyQuery(req: NextApiRequest): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else if (value !== undefined) {
      params.append(key, value);
    }
  }
  return params;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!["GET", "POST", "DELETE"].includes(req.method ?? "")) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const segments = getPathSegments(req);
  if (segments.some((segment) => !isSafeSegment(segment))) {
    return res.status(400).json({ error: "Invalid EvalBear eval path" });
  }

  const targetPath = resolveTargetPath(segments);
  if (!targetPath) {
    return res.status(404).json({ error: "Unknown EvalBear eval endpoint" });
  }

  const baseUrl = (
    process.env.EVAL_SERVICE_WEB_URL ?? DEFAULT_EVAL_SERVICE_URL
  ).replace(/\/+$/, "");
  const query = copyQuery(req);
  const queryString = query.toString();
  const targetUrl = `${baseUrl}${targetPath}${
    queryString ? `?${queryString}` : ""
  }`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Source": "langfuse-web",
  };
  if (process.env.EVAL_SERVICE_INTERNAL_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EVAL_SERVICE_INTERNAL_TOKEN}`;
  }
  if (req.method !== "GET") {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method === "GET" ? undefined : JSON.stringify(req.body ?? {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(502).json({
      error: "EvalBear eval-service is unavailable",
      detail: message,
    });
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return res.status(response.status).send(body);
}
