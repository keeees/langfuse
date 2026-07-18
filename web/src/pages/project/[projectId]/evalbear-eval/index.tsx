import Page from "@/src/components/layouts/page";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { env } from "@/src/env.mjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { cn } from "@/src/utils/tailwind";
import { ExternalLink, RefreshCw } from "lucide-react";
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

async function fetchEvalBear<T>(
  path: string,
  projectId: string,
  init?: RequestInit,
): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `/api/redbear/eval/${path}${separator}projectId=${encodeURIComponent(projectId)}`;
  const response = await fetch(url, {
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
          : `EvalBear Eval API 返回状态码 ${response.status}`;
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

function getEvalWebUrl(projectId?: string): string {
  const baseUrl = (
    env.NEXT_PUBLIC_EVAL_WEB_URL ?? "http://localhost:3001"
  ).replace(/\/+$/, "");
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", projectId);
  const query = params.toString();
  return `${baseUrl}/${query ? `?${query}` : ""}`;
}

export default function EvalBearEvalPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string | undefined;

  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [trials, setTrials] = useState<TrialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRuns = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchEvalBear<{ runs: RunRecord[] }>(
        "runs",
        projectId,
      );
      setRuns(data.runs ?? []);
      if (!selectedRunId && data.runs?.[0]?.run_id) {
        setSelectedRunId(data.runs[0].run_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载运行列表失败");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, selectedRunId]);

  const refreshSelectedRun = useCallback(async () => {
    if (!selectedRunId || !projectId) {
      setSelectedRun(null);
      setTrials([]);
      return;
    }

    setError(null);
    try {
      const [run, trialData] = await Promise.all([
        fetchEvalBear<RunDetail>(
          `runs/${encodeURIComponent(selectedRunId)}`,
          projectId,
        ),
        fetchEvalBear<{ trials: TrialRecord[] }>(
          `runs/${encodeURIComponent(selectedRunId)}/trials?limit=200`,
          projectId,
        ),
      ]);
      setSelectedRun(run);
      setTrials(trialData.trials ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载运行详情失败");
    }
  }, [projectId, selectedRunId]);

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

  return (
    <Page
      headerProps={{
        title: "EvalBear 评测",
        help: {
          description:
            "通过 eval-service 运行 EvalBear 记忆评测，并查看关联的追踪记录。",
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
          <h2 className="mb-3 text-base font-semibold">评测中心</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            创建和管理评测运行。关联到此项目的结果将显示在下方。
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <a
              href={`/project/${projectId}/evalbear-eval/agent`}
              className="border-border bg-card hover:border-accent rounded-md border p-3 hover:shadow-sm"
            >
              <h3 className="text-sm font-medium">Agent 评测</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                任务成功率、工具调用过程、trace drill-down。
              </p>
            </a>
            <a
              href={`/project/${projectId}/evalbear-eval/memory`}
              className="border-border bg-card hover:border-accent rounded-md border p-3 hover:shadow-sm"
            >
              <h3 className="text-sm font-medium">记忆评测</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                记忆写入和召回准确性。
              </p>
            </a>
            <a
              href={`/project/${projectId}/evalbear-eval/rag`}
              className="border-border bg-card hover:border-accent rounded-md border p-3 hover:shadow-sm"
            >
              <h3 className="text-sm font-medium">RAG 评测</h3>
              <p className="text-muted-foreground mt-1 text-xs">
                知识库检索和回答质量。
              </p>
            </a>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="bg-background rounded-md border">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">运行列表</h2>
            </div>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>运行</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>创建时间</TableHead>
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
                        暂无 EvalBear 评测运行记录。
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="bg-background rounded-md border">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">运行详情</h2>
            </div>
            {selectedRun ? (
              <div className="flex flex-col gap-3 p-4">
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">运行 ID</span>
                    <div className="truncate font-mono">
                      {selectedRun.run_id}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">状态</span>
                    <div>
                      <Badge variant={statusVariant(selectedRun.status)}>
                        {selectedRun.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">更新时间</span>
                    <div>{formatTime(selectedRun.updated_at)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">错误</span>
                    <div className="text-destructive truncate">
                      {selectedRun.error ?? "-"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">类型</span>
                    <div>{selectedRun.kind ?? "-"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">总样本数</span>
                    <div>
                      {String(
                        selectedRun.summary?.total_cases ??
                          selectedRun.summary?.total ??
                          "-",
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">通过率</span>
                    <div>
                      {selectedRun.summary?.pass_rate != null
                        ? `${(Number(selectedRun.summary.pass_rate) * 100).toFixed(1)}%`
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">失败数</span>
                    <div>
                      {String(
                        selectedRun.summary?.failed ??
                          selectedRun.summary?.errors ??
                          "-",
                      )}
                    </div>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
                    查看原始结果
                  </summary>
                  <pre className="bg-muted mt-2 max-h-56 overflow-auto rounded-md p-3 text-xs">
                    {summaryText}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="text-muted-foreground p-4 text-sm">
                选择一个运行以查看详情。
              </div>
            )}
          </div>
        </section>

        <section className="bg-background rounded-md border">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">试验列表</h2>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用例</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>通过</TableHead>
                  <TableHead>评分</TableHead>
                  <TableHead>追踪</TableHead>
                  <TableHead>错误</TableHead>
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
                            ? "通过"
                            : "未通过"}
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
                              <span className="ml-1">查看</span>
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
                      暂无所选运行的试验记录。
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
