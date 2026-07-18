import { getServerAuthSession } from "@/src/server/auth";
import { hasProjectAccess } from "@/src/features/rbac/utils/checkProjectAccess";
import { type NextApiRequest, type NextApiResponse } from "next";

const DEFAULT_EVAL_SERVICE_URL = "http://eval-service:8765";

// ── Path allowlist with per-path method rules ──

type PathRule = {
  resolve: (segments: string[]) => string | null;
  methods: string[];
  /** Scope required for write operations (POST/PUT/DELETE). Read uses evalJob:read. */
  writeScope?: "evalJob:CUD";
};

const PATH_RULES: PathRule[] = [
  {
    resolve: (s) => (s.length === 1 && s[0] === "health" ? "/health" : null),
    methods: ["GET"],
  },
  {
    resolve: (s) =>
      s.length === 1 && s[0] === "suites" ? "/api/eval/suites" : null,
    methods: ["GET"],
  },
  {
    resolve: (s) =>
      s.length === 1 && s[0] === "runs" ? "/api/eval/runs" : null,
    methods: ["GET", "POST"],
    writeScope: "evalJob:CUD",
  },
  {
    resolve: (s) =>
      s.length === 2 && s[0] === "runs"
        ? `/api/eval/runs/${encodeURIComponent(s[1])}`
        : null,
    methods: ["GET"],
  },
  {
    resolve: (s) =>
      s.length === 3 &&
      s[0] === "runs" &&
      ["trials", "events", "artifacts"].includes(s[2])
        ? `/api/eval/runs/${encodeURIComponent(s[1])}/${s[2]}`
        : null,
    methods: ["GET"],
  },
  {
    resolve: (s) =>
      s.length === 2 && s[0] === "trials"
        ? `/api/eval/trials/${encodeURIComponent(s[1])}`
        : null,
    methods: ["GET"],
  },
  {
    resolve: (s) =>
      s.length === 3 && s[0] === "trials" && s[2] === "human-eval"
        ? `/api/eval/trials/${encodeURIComponent(s[1])}/human-eval`
        : null,
    methods: ["GET", "POST"],
    writeScope: "evalJob:CUD",
  },
  {
    resolve: (s) =>
      s.length === 2 && s[0] === "artifacts"
        ? `/api/eval/artifacts/${encodeURIComponent(s[1])}`
        : null,
    methods: ["GET"],
  },
  // Project config endpoints
  {
    resolve: (s) =>
      s.length === 3 && s[0] === "projects" && s[2] === "config"
        ? `/api/eval/projects/${encodeURIComponent(s[1])}/config`
        : null,
    methods: ["GET", "PUT"],
    writeScope: "evalJob:CUD",
  },
  {
    resolve: (s) =>
      s.length === 4 &&
      s[0] === "projects" &&
      s[2] === "config" &&
      s[3] === "check"
        ? `/api/eval/projects/${encodeURIComponent(s[1])}/config/check`
        : null,
    methods: ["POST"],
  },
];

// ── Helpers ──

function getPathSegments(req: NextApiRequest): string[] {
  const rawPath = req.query.path;
  if (!Array.isArray(rawPath)) return [];
  return rawPath.filter((segment) => segment.length > 0);
}

function isSafeSegment(segment: string): boolean {
  return /^[A-Za-z0-9_.:-]+$/.test(segment);
}

function resolveRoute(segments: string[]): {
  targetPath: string;
  rule: PathRule;
} | null {
  for (const rule of PATH_RULES) {
    const path = rule.resolve(segments);
    if (path !== null) return { targetPath: path, rule };
  }
  return null;
}

function copyQuery(req: NextApiRequest): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path" || key === "projectId") continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else if (value !== undefined) {
      params.append(key, value);
    }
  }
  return params;
}

function jsonError(
  res: NextApiResponse,
  status: number,
  error: string,
  detail?: string,
) {
  const body: Record<string, string> = { error };
  if (detail) body.detail = detail;
  return res.status(status).json(body);
}

// ── Handler ──

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1. Authenticate session
  const session = await getServerAuthSession({ req, res });
  if (!session) {
    return jsonError(res, 401, "Unauthorized");
  }

  // 2. Extract and validate projectId
  const projectId = req.query.projectId as string | undefined;
  if (!projectId || typeof projectId !== "string") {
    return jsonError(res, 400, "Missing projectId query parameter");
  }

  // 3. Check project read access
  if (!hasProjectAccess({ session, projectId, scope: "evalJob:read" })) {
    return jsonError(res, 403, "Forbidden");
  }

  // 4. Validate path segments
  const segments = getPathSegments(req);
  if (segments.some((segment) => !isSafeSegment(segment))) {
    return jsonError(res, 400, "Invalid path segment");
  }

  // 5. Resolve path against allowlist
  const route = resolveRoute(segments);
  if (!route) {
    return jsonError(res, 404, "Unknown endpoint");
  }

  // 6. Check method against per-path allowlist
  const method = req.method ?? "GET";
  if (!route.rule.methods.includes(method)) {
    res.setHeader("Allow", route.rule.methods.join(", "));
    return jsonError(res, 405, "Method not allowed");
  }

  // 7. For write methods, check write scope
  if (method !== "GET" && route.rule.writeScope) {
    if (
      !hasProjectAccess({ session, projectId, scope: route.rule.writeScope })
    ) {
      return jsonError(
        res,
        403,
        "Forbidden: insufficient permissions for this action",
      );
    }
  }

  // 8. Build target URL
  const baseUrl = (
    process.env.EVAL_SERVICE_WEB_URL ?? DEFAULT_EVAL_SERVICE_URL
  ).replace(/\/+$/, "");
  const query = copyQuery(req);
  // Inject project scoping for list-runs GET
  if (route.targetPath === "/api/eval/runs" && method === "GET") {
    query.set("langfuse_project_id", projectId);
  }
  const queryString = query.toString();
  const targetUrl = `${baseUrl}${route.targetPath}${queryString ? `?${queryString}` : ""}`;

  // 9. Build headers
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Source": "langfuse-web",
    "X-Langfuse-Project-Id": projectId,
  };
  if (process.env.EVAL_SERVICE_INTERNAL_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EVAL_SERVICE_INTERNAL_TOKEN}`;
  }

  // 10. Build body - inject langfuse_project_id and user identity for writes
  let body: string | undefined;
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    const reqBody =
      typeof req.body === "object" && req.body !== null ? { ...req.body } : {};

    if (route.targetPath === "/api/eval/runs" && method === "POST") {
      // Inject project scoping and user identity into create-run config
      const config = reqBody.config ?? {};
      reqBody.config = {
        ...config,
        langfuse_project_id: projectId,
        created_by_user_id: session.user?.id ?? null,
        created_by_email: session.user?.email ?? null,
        created_by_name: session.user?.name ?? null,
        created_via: "langfuse-web",
      };
    }

    if (route.targetPath.endsWith("/human-eval") && method === "POST") {
      // Inject reviewer identity, discard client-provided reviewer fields
      delete reqBody.reviewer;
      delete reqBody.reviewer_user_id;
      delete reqBody.reviewer_email;
      delete reqBody.reviewer_name;
      reqBody.reviewer_user_id = session.user?.id ?? null;
      reqBody.reviewer_email = session.user?.email ?? null;
      reqBody.reviewer_name = session.user?.name ?? null;
      // Map legacy decision/notes to standard fields if present
      if (
        reqBody.decision !== undefined &&
        reqBody.human_passed === undefined
      ) {
        reqBody.human_passed =
          reqBody.decision === "通过"
            ? true
            : reqBody.decision === "驳回"
              ? false
              : null;
        delete reqBody.decision;
      }
      if (reqBody.notes !== undefined && reqBody.human_notes === undefined) {
        reqBody.human_notes = reqBody.notes;
        delete reqBody.notes;
      }
    }

    body = JSON.stringify(reqBody);
  }

  // 11. Forward request to eval-service
  let response: Response;
  try {
    response = await fetch(targetUrl, { method, headers, body });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonError(res, 502, "Eval service unavailable", message);
  }

  // 12. Return response
  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return res.status(response.status).send(responseBody);
}
