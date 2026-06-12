import Page from "@/src/components/layouts/page";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { cn } from "@/src/utils/tailwind";
import { ExternalLink, Play, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";

type RunRecord = {
  run_id: string;
  status: "queued" | "running" | "completed" | "failed" | string;
  kind?: string;
  created_at?: string;
  updated_at?: string;
  summary?: Record<string, unknown> | null;
  error?: string | null;
};

type TrialRecord = {
  id?: number;
  trial_id?: number;
  case_id?: string;
  status?: string;
  dimension?: string;
  passed?: boolean | null;
  score?: number | null;
  raw?: Record<string, unknown> | null;
  error?: string | null;
};

type RunDetail = RunRecord & {
  metrics?: Record<string, unknown>;
  artifacts?: unknown[];
};

async function fetchEvalBear<T>(path: string, init?: RequestInit): Promise<T> {
  // TODO(evalbear-rename): coordinate with eval_service_web/ to rename mount to /api/evalbear/eval/
  const response = await fetch(`/api/redbear/eval/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload?.detail === "string"
        ? payload.detail
        : typeof payload?.error === "string"
          ? payload.error
          : `EvalBear Eval API returned ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  return "secondary";
}

function formatTime(value?: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function getTraceId(trial: TrialRecord): string | null {
  const rawTrace = trial.raw?.langfuse_trace_id;
  if (typeof rawTrace === "string" && rawTrace.length > 0) return rawTrace;
  return null;
}

export default function EvalBearEvalPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string | undefined;

  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [trials, setTrials] = useState<TrialRecord[]>([]);
  const [benchmark, setBenchmark] = useState("longmemeval");
  const [limit, setLimit] = useState("1");
  const [startIndex, setStartIndex] = useState("0");
  const [noLlmJudge, setNoLlmJudge] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRuns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchEvalBear<{ runs: RunRecord[] }>("runs");
      setRuns(data.runs ?? []);
      if (!selectedRunId && data.runs?.[0]?.run_id) {
        setSelectedRunId(data.runs[0].run_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load runs");
    } finally {
      setIsLoading(false);
    }
  }, [selectedRunId]);

  const refreshSelectedRun = useCallback(async () => {
    if (!selectedRunId) {
      setSelectedRun(null);
      setTrials([]);
      return;
    }

    setError(null);
    try {
      const [run, trialData] = await Promise.all([
        fetchEvalBear<RunDetail>(`runs/${encodeURIComponent(selectedRunId)}`),
        fetchEvalBear<{ trials: TrialRecord[] }>(
          `runs/${encodeURIComponent(selectedRunId)}/trials?limit=200`,
        ),
      ]);
      setSelectedRun(run);
      setTrials(trialData.trials ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load run");
    }
  }, [selectedRunId]);

  useEffect(() => {
    refreshRuns();
  }, [refreshRuns]);

  useEffect(() => {
    refreshSelectedRun();
  }, [refreshSelectedRun]);

  useEffect(() => {
    if (!selectedRun || !["queued", "running"].includes(selectedRun.status)) {
      return;
    }

    const timer = window.setInterval(() => {
      refreshRuns();
      refreshSelectedRun();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [refreshRuns, refreshSelectedRun, selectedRun]);

  const summaryText = useMemo(() => {
    if (!selectedRun?.summary) return "{}";
    return JSON.stringify(selectedRun.summary, null, 2);
  }, [selectedRun]);

  async function createMemoryRun() {
    const parsedLimit = Number.parseInt(limit, 10);
    const parsedStartIndex = Number.parseInt(startIndex, 10);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      setError("Limit must be a positive integer.");
      return;
    }
    if (!Number.isInteger(parsedStartIndex) || parsedStartIndex < 0) {
      setError("Start index must be zero or greater.");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const created = await fetchEvalBear<{ run_id: string }>("runs", {
        method: "POST",
        body: JSON.stringify({
          runner_id: "memory_eval",
          config: {
            benchmark,
            limit: parsedLimit,
            start_index: parsedStartIndex,
            no_llm_judge: noLlmJudge,
          },
        }),
      });
      const data = await fetchEvalBear<{ runs: RunRecord[] }>("runs");
      setRuns(data.runs ?? []);
      setSelectedRunId(created.run_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create run");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Page
      headerProps={{
        title: "EvalBear Eval",
        help: {
          description:
            "Run EvalBear memory evaluations through eval-service and inspect linked Langfuse traces from one project page.",
          href: "https://langfuse.com/docs/evaluation/overview",
        },
        actionButtonsRight: (
          <Button
            variant="outline"
            onClick={() => {
              refreshRuns();
              refreshSelectedRun();
            }}
            loading={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="ml-2">刷新</span>
          </Button>
        ),
      }}
      scrollable
      withPadding
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            {error}
          </div>
        ) : null}

        <section className="bg-background rounded-md border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Create memory eval</h2>
              <p className="text-muted-foreground text-sm">
                Starts a EvalBear memory_eval run in eval-service. Secrets and
                MemoryBear endpoints are read from eval-service environment.
              </p>
            </div>
            <Button onClick={createMemoryRun} loading={isCreating}>
              <Play className="h-4 w-4" />
              <span className="ml-2">Run</span>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Benchmark</span>
              <select
                value={benchmark}
                onChange={(event) => setBenchmark(event.target.value)}
                className="border-input bg-background h-8 rounded-md border px-2 text-sm"
              >
                <option value="longmemeval">longmemeval</option>
                <option value="locomo">locomo</option>
                <option value="memsciqa">memsciqa</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Limit</span>
              <Input value={limit} onChange={(e) => setLimit(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Start index</span>
              <Input
                value={startIndex}
                onChange={(e) => setStartIndex(e.target.value)}
              />
            </label>
            <label className="flex items-end gap-2 text-sm">
              <input
                type="checkbox"
                checked={noLlmJudge}
                onChange={(event) => setNoLlmJudge(event.target.checked)}
                className="mb-2"
              />
              <span className="pb-1">Skip LLM judge</span>
            </label>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="bg-background rounded-md border">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Runs</h2>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow
                      key={run.run_id}
                      className={cn(
                        "cursor-pointer",
                        selectedRunId === run.run_id && "bg-muted",
                      )}
                      onClick={() => setSelectedRunId(run.run_id)}
                    >
                      <TableCell className="truncate font-mono">
                        {run.run_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(run.status)}>
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{run.kind ?? "-"}</TableCell>
                      <TableCell>{formatTime(run.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {runs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-muted-foreground h-20 text-center"
                      >
                        No EvalBear eval runs yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="bg-background rounded-md border">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Run detail</h2>
            </div>
            {selectedRun ? (
              <div className="flex flex-col gap-3 p-4">
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Run ID</span>
                    <div className="truncate font-mono">
                      {selectedRun.run_id}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div>
                      <Badge variant={statusVariant(selectedRun.status)}>
                        {selectedRun.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated</span>
                    <div>{formatTime(selectedRun.updated_at)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Error</span>
                    <div className="text-destructive truncate">
                      {selectedRun.error ?? "-"}
                    </div>
                  </div>
                </div>
                <pre className="bg-muted max-h-56 overflow-auto rounded-md p-3 text-xs">
                  {summaryText}
                </pre>
              </div>
            ) : (
              <div className="text-muted-foreground p-4 text-sm">
                Select a run to inspect details.
              </div>
            )}
          </div>
        </section>

        <section className="bg-background rounded-md border">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Trials</h2>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Trace</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trials.map((trial, index) => {
                  const traceId = getTraceId(trial);
                  return (
                    <TableRow key={trial.id ?? trial.trial_id ?? index}>
                      <TableCell className="truncate font-mono">
                        {trial.case_id ?? trial.id ?? trial.trial_id ?? "-"}
                      </TableCell>
                      <TableCell>{trial.status ?? "-"}</TableCell>
                      <TableCell>
                        {trial.passed === null || trial.passed === undefined
                          ? "-"
                          : trial.passed
                            ? "PASS"
                            : "FAIL"}
                      </TableCell>
                      <TableCell>
                        {typeof trial.score === "number"
                          ? trial.score.toFixed(3)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {traceId && projectId ? (
                          <Button asChild variant="ghost" size="sm">
                            <Link
                              href={`/project/${projectId}/traces/${traceId}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="ml-1">Open</span>
                            </Link>
                          </Button>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-destructive truncate">
                        {trial.error ?? "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {trials.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground h-20 text-center"
                    >
                      No trials for the selected run yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </Page>
  );
}
