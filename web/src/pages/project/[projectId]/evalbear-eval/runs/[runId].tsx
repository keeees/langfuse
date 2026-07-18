import Page from "@/src/components/layouts/page";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { LoadingSkeleton, ErrorState } from "@/src/components/evalbear";
import {
  fetchRunDetail,
  fetchTrials,
  fetchEvents,
  fetchArtifacts,
} from "@/src/features/evalbear/api";
import type {
  EvalRunDetail,
  EvalTrial,
  EvalEvent,
  EvalArtifact,
} from "@/src/features/evalbear/types";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";

type Tab = "trials" | "events" | "artifacts" | "summary";

export default function RunDetailPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const runId = router.query.runId as string;
  const [run, setRun] = useState<EvalRunDetail | null>(null);
  const [trials, setTrials] = useState<EvalTrial[]>([]);
  const [events, setEvents] = useState<EvalEvent[]>([]);
  const [artifacts, setArtifacts] = useState<EvalArtifact[]>([]);
  const [selected, setSelected] = useState<EvalTrial | null>(null);
  const [tab, setTab] = useState<Tab>("trials");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId || !runId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [r, t, e, a] = await Promise.all([
        fetchRunDetail(projectId, runId),
        fetchTrials(projectId, runId).then((d) => d.trials),
        fetchEvents(projectId, runId)
          .then((d) => d.events)
          .catch(() => []),
        fetchArtifacts(projectId, runId)
          .then((d) => d.artifacts)
          .catch(() => []),
      ]);
      setRun(r);
      setTrials(t);
      setEvents(e);
      setArtifacts(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, runId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalCases = trials.length;
  const passRate =
    totalCases > 0
      ? (
          (trials.filter((t) => t.passed === true).length / totalCases) *
          100
        ).toFixed(1)
      : "—";
  const traceId = selected?.raw?.langfuse_trace_id as string | undefined;

  return (
    <Page headerProps={{ title: `运行详情` }} scrollable withPadding>
      <Head>
        <title>运行详情 | EvalBear</title>
      </Head>
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState
          title="加载失败"
          description={error}
          action={{ label: "重试", onClick: load }}
        />
      ) : !run ? (
        <ErrorState title="运行未找到" description={`运行 ${runId} 不存在。`} />
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/project/${projectId}/evalbear-eval/history`}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回
              </Link>
            </Button>
            <Badge
              variant={
                run.status === "completed"
                  ? "default"
                  : run.status === "failed"
                    ? "destructive"
                    : "secondary"
              }
            >
              {run.status}
            </Badge>
            <span className="text-muted-foreground truncate font-mono text-xs">
              {run.run_id}
            </span>
            <Button variant="ghost" size="sm" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Metrics cards */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="border-border bg-card rounded border p-3 text-center">
              <p className="text-lg font-bold">{totalCases}</p>
              <p className="text-muted-foreground text-xs">总样本</p>
            </div>
            <div className="border-border bg-card rounded border p-3 text-center">
              <p className="text-lg font-bold">{passRate}%</p>
              <p className="text-muted-foreground text-xs">通过率</p>
            </div>
            <div className="border-border bg-card rounded border p-3 text-center">
              <p className="text-lg font-bold">{run.kind}</p>
              <p className="text-muted-foreground text-xs">类型</p>
            </div>
            <div className="border-border bg-card rounded border p-3 text-center">
              <p className="text-lg font-bold">{artifacts.length}</p>
              <p className="text-muted-foreground text-xs">产物</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-border flex gap-1 border-b">
            {(["trials", "events", "artifacts", "summary"] as Tab[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs font-medium ${tab === t ? "border-accent text-accent border-b-2" : "text-muted-foreground"}`}
                >
                  {t === "trials"
                    ? `用例 (${totalCases})`
                    : t === "events"
                      ? `事件 (${events.length})`
                      : t === "artifacts"
                        ? `产物 (${artifacts.length})`
                        : "摘要"}
                </button>
              ),
            )}
          </div>

          {/* Tab content */}
          {tab === "trials" && (
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="border-border overflow-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用例</TableHead>
                      <TableHead>通过</TableHead>
                      <TableHead>评分</TableHead>
                      <TableHead>维度</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trials.map((t) => (
                      <TableRow
                        key={t.id}
                        className={`cursor-pointer ${selected?.id === t.id ? "bg-accent-soft" : ""}`}
                        onClick={() => setSelected(t)}
                      >
                        <TableCell className="truncate font-mono text-xs">
                          {t.case_id}
                        </TableCell>
                        <TableCell>
                          {t.passed === true
                            ? "✓"
                            : t.passed === false
                              ? "✗"
                              : "—"}
                        </TableCell>
                        <TableCell>
                          {t.score != null ? Number(t.score).toFixed(3) : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {t.dimension ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Selected trial detail */}
              <div className="border-border bg-card rounded border p-4">
                {selected ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">用例 ID：</span>
                      <span className="font-mono">{selected.case_id}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">输入：</span>
                      <pre className="bg-muted mt-1 max-h-32 overflow-auto rounded p-2 text-xs">
                        {JSON.stringify(selected.input, null, 2) ?? "暂无数据"}
                      </pre>
                    </div>
                    <div>
                      <span className="text-muted-foreground">期望：</span>
                      <pre className="bg-muted mt-1 max-h-32 overflow-auto rounded p-2 text-xs">
                        {JSON.stringify(selected.expected, null, 2) ??
                          "暂无数据"}
                      </pre>
                    </div>
                    <div>
                      <span className="text-muted-foreground">输出：</span>
                      <pre className="bg-muted mt-1 max-h-32 overflow-auto rounded p-2 text-xs">
                        {JSON.stringify(selected.output, null, 2) ?? "暂无数据"}
                      </pre>
                    </div>
                    {selected.reasoning && (
                      <div>
                        <span className="text-muted-foreground">
                          评判推理：
                        </span>
                        <p className="mt-1 text-xs">{selected.reasoning}</p>
                      </div>
                    )}
                    {selected.human_evaluation && (
                      <div className="border-border border-t pt-2">
                        <span className="text-muted-foreground">
                          人工复核：
                        </span>
                        <span>
                          {selected.human_evaluation.human_passed
                            ? "通过"
                            : "未通过"}
                        </span>
                        {selected.human_evaluation.reviewer_name && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            by {selected.human_evaluation.reviewer_name}
                          </span>
                        )}
                      </div>
                    )}
                    {traceId ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/project/${projectId}/traces/${traceId}`}>
                          <ExternalLink className="mr-1 h-3 w-3" />
                          查看 Langfuse 追踪
                        </Link>
                      </Button>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        暂无追踪链接
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    选择一个用例查看详情
                  </p>
                )}
              </div>
            </div>
          )}

          {tab === "events" && (
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-sm">暂无事件</p>
              ) : (
                events.map((e) => (
                  <div
                    key={e.id}
                    className="border-border flex items-start gap-3 rounded border p-2 text-xs"
                  >
                    <Badge variant="secondary">{e.level}</Badge>
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{e.event_type}</span>
                      <p className="text-muted-foreground">{e.message}</p>
                    </div>
                    <span className="text-muted-foreground shrink-0">
                      {new Date(e.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "artifacts" && (
            <div className="space-y-2">
              {artifacts.length === 0 ? (
                <p className="text-muted-foreground text-sm">暂无产物</p>
              ) : (
                artifacts.map((a) => (
                  <div
                    key={a.id}
                    className="border-border flex items-center gap-3 rounded border p-2 text-xs"
                  >
                    <Badge variant="secondary">{a.artifact_type}</Badge>
                    <span className="truncate">{a.name}</span>
                    <span className="text-muted-foreground ml-auto">
                      {a.media_type ?? ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "summary" && (
            <div>
              {run.summary ? (
                <pre className="border-border bg-muted max-h-96 overflow-auto rounded border p-4 text-xs">
                  {JSON.stringify(run.summary, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground text-sm">暂无摘要</p>
              )}
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
