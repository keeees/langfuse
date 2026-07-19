/**
 * Shared helper for building EvalBear → Langfuse trace links.
 *
 * EvalBear publishes traces with a single static Langfuse credential, so a
 * trace lands in whatever project owns that credential — not necessarily the
 * current EvalBear UI project. The runners record the trace's real project as
 * `langfuse_trace_project_id` in the trial `raw`, so every trace entry point
 * (overview, run detail, trial detail, review) must link to that project and
 * flag cross-project traces instead of linking into the current UI project
 * (which 404s when they differ). This helper is the single source of truth so
 * the four pages cannot drift apart again.
 */

export type TraceLink = {
  /** The Langfuse trace id, or null when the case was not published. */
  traceId: string | null;
  /** The trace's real Langfuse project id, when recorded. */
  traceProjectId: string | null;
  /** Project id to use when building the in-app trace URL. */
  linkProject: string | null;
  /** True when the trace lives in a different project than the current page. */
  crossProject: boolean;
};

/**
 * Derive trace-link fields from a trial's `raw` payload and the current project.
 *
 * @param raw - The trial `raw` JSON (any shape; safely narrowed internally).
 * @param currentProjectId - The project id of the current EvalBear page.
 */
export function getTraceLink(
  raw: unknown,
  currentProjectId: string | undefined,
): TraceLink {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const rawTrace = record.langfuse_trace_id;
  const traceId =
    typeof rawTrace === "string" && rawTrace.length > 0 ? rawTrace : null;

  const rawProject = record.langfuse_trace_project_id;
  const traceProjectId =
    typeof rawProject === "string" && rawProject.length > 0 ? rawProject : null;

  const linkProject = traceProjectId ?? currentProjectId ?? null;
  const crossProject = Boolean(
    traceProjectId && currentProjectId && traceProjectId !== currentProjectId,
  );

  return { traceId, traceProjectId, linkProject, crossProject };
}

/** Human-readable cross-project caveat shown next to a trace link. */
export function crossProjectTraceHint(traceProjectId: string): string {
  return `该追踪发布在其他 Langfuse 项目（${traceProjectId}），若当前账号无该项目权限可能无法打开。`;
}
