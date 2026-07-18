/**
 * Shared types for EvalBear evaluation data.
 * Mirrors eval-service response shapes.
 */

export type EvalSuite = {
  id: string;
  kind: string;
  label: string;
  description?: string;
  config_schema?: Record<string, unknown>;
};

export type EvalRunRecord = {
  run_id: string;
  suite_id: string;
  runner_id: string;
  kind: string;
  status: "queued" | "running" | "completed" | "failed" | string;
  config?: Record<string, unknown>;
  dataset_path?: string;
  summary?: Record<string, unknown> | null;
  error?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string | null;
  created_by_email?: string | null;
  created_by_name?: string | null;
  created_via?: string | null;
};

export type EvalRunDetail = EvalRunRecord & {
  metrics?: EvalMetric[];
  artifacts?: EvalArtifact[];
  events?: EvalEvent[];
};

export type EvalTrial = {
  id: number;
  run_id: string;
  case_id: string;
  dimension?: string | null;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  expected?: Record<string, unknown> | null;
  passed?: boolean | null;
  score?: number | null;
  grader?: string | null;
  reasoning?: string | null;
  latency_ms?: number | null;
  error?: string | null;
  raw?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  human_evaluation?: HumanEvaluation | null;
};

export type EvalMetric = {
  id: number;
  run_id: string;
  trial_id?: number | null;
  name: string;
  value?: number | null;
  target?: number | null;
  passed?: boolean | null;
  grader?: string | null;
  metadata_json?: Record<string, unknown> | null;
  created_at: string;
};

export type EvalArtifact = {
  id: number;
  run_id: string;
  trial_id?: number | null;
  artifact_type: string;
  name: string;
  path: string;
  media_type?: string | null;
  metadata_json?: Record<string, unknown> | null;
  created_at: string;
};

export type EvalEvent = {
  id: number;
  run_id: string;
  trial_id?: number | null;
  level: string;
  event_type: string;
  message: string;
  payload?: Record<string, unknown> | null;
  created_at: string;
};

export type HumanEvaluation = {
  id: number;
  trial_id: number;
  human_score?: number | null;
  human_passed?: boolean | null;
  human_notes?: string | null;
  reviewer?: string | null;
  reviewer_user_id?: string | null;
  reviewer_email?: string | null;
  reviewer_name?: string | null;
  created_at: string;
  updated_at: string;
};

export type HumanEvalRequest = {
  human_passed?: boolean | null;
  human_score?: number | null;
  human_notes?: string | null;
};

export type CreateRunRequest = {
  runner_id: string;
  config?: Record<string, unknown>;
};

export type PaginatedTrials = {
  trials: EvalTrial[];
  total?: number;
  page?: number;
  limit?: number;
};
