/**
 * EvalBear API client.
 * All requests go through /api/redbear/eval/ proxy.
 */

import type {
  CreateRunRequest,
  EvalArtifact,
  EvalEvent,
  EvalRunDetail,
  EvalRunRecord,
  EvalSuite,
  EvalTrial,
  HumanEvalRequest,
  PaginatedTrials,
} from "./types";

const BASE = "/api/redbear/eval";

async function request<T>(
  path: string,
  projectId: string,
  init?: RequestInit,
): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE}/${path}${sep}projectId=${encodeURIComponent(projectId)}`;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? body?.error ?? `请求失败 (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function fetchSuites(projectId: string) {
  return request<{ suites: EvalSuite[] }>("suites", projectId);
}

export function fetchRuns(projectId: string, params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<{ runs: EvalRunRecord[] }>(`runs${qs}`, projectId);
}

export function fetchRunDetail(projectId: string, runId: string) {
  return request<EvalRunDetail>(`runs/${encodeURIComponent(runId)}`, projectId);
}

export function createRun(projectId: string, body: CreateRunRequest) {
  return request<{ run_id: string; status: string }>("runs", projectId, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchTrials(
  projectId: string,
  runId: string,
  params?: Record<string, string>,
) {
  const qs = params ? "&" + new URLSearchParams(params).toString() : "";
  return request<PaginatedTrials>(
    `runs/${encodeURIComponent(runId)}/trials?limit=200${qs}`,
    projectId,
  );
}

export function fetchTrial(projectId: string, trialId: string | number) {
  return request<EvalTrial>(
    `trials/${encodeURIComponent(String(trialId))}`,
    projectId,
  );
}

export function fetchEvents(projectId: string, runId: string) {
  return request<{ events: EvalEvent[] }>(
    `runs/${encodeURIComponent(runId)}/events`,
    projectId,
  );
}

export function fetchArtifacts(projectId: string, runId: string) {
  return request<{ artifacts: EvalArtifact[] }>(
    `runs/${encodeURIComponent(runId)}/artifacts`,
    projectId,
  );
}

export function submitHumanEval(
  projectId: string,
  trialId: string | number,
  body: HumanEvalRequest,
) {
  return request<Record<string, unknown>>(
    `trials/${encodeURIComponent(String(trialId))}/human-eval`,
    projectId,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
