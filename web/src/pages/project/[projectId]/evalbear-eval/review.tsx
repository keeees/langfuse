import Page from "@/src/components/layouts/page";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/src/components/evalbear";
import {
  fetchRuns,
  fetchTrials,
  submitHumanEval,
} from "@/src/features/evalbear/api";
import type {
  EvalRunRecord,
  EvalTrial,
  HumanEvalRequest,
} from "@/src/features/evalbear/types";
import {
  getTraceLink,
  crossProjectTraceHint,
} from "@/src/features/evalbear/trace-link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function TrialReviewPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [runs, setRuns] = useState<EvalRunRecord[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [trials, setTrials] = useState<EvalTrial[]>([]);
  const [selected, setSelected] = useState<EvalTrial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [humanPassed, setHumanPassed] = useState<boolean | null>(null);
  const [humanScore, setHumanScore] = useState("");
  const [humanNotes, setHumanNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "failed" | "unreviewed">(
    "unreviewed",
  );

  const loadRuns = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await fetchRuns(projectId);
      const completed = data.runs.filter((r) => r.status === "completed");
      setRuns(completed);
      if (completed.length > 0 && !selectedRunId)
        setSelectedRunId(completed[0].run_id);
    } catch {}
  }, [projectId, selectedRunId]);

  const loadTrials = useCallback(async () => {
    if (!projectId) return;
    // No completed run to review (e.g. a brand-new project): clear the loading
    // state so the empty state renders instead of hanging on the skeleton.
    if (!selectedRunId) {
      setTrials([]);
      setSelected(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTrials(projectId, selectedRunId);
      setTrials(data.trials);
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, selectedRunId]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);
  useEffect(() => {
    loadTrials();
  }, [loadTrials]);

  const filteredTrials = trials.filter((t) => {
    if (filter === "failed") return t.passed === false;
    if (filter === "unreviewed") return !t.human_evaluation;
    return true;
  });

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const body: HumanEvalRequest = {
        human_passed: humanPassed,
        human_score: humanScore ? Number(humanScore) : null,
        human_notes: humanNotes || null,
      };
      await submitHumanEval(projectId, selected.id, body);
      await loadTrials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const { traceId, linkProject, crossProject, traceProjectId } = getTraceLink(
    selected?.raw,
    projectId,
  );

  return (
    <Page headerProps={{ title: "样本复核" }} scrollable withPadding>
      <Head>
        <title>样本复核 | EvalBear</title>
      </Head>
      {/* Run selector + filter */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={selectedRunId}
          onChange={(e) => setSelectedRunId(e.target.value)}
          className="border-input bg-background rounded border px-2 py-1 text-xs"
        >
          {runs.map((r) => (
            <option key={r.run_id} value={r.run_id}>
              {r.run_id.slice(0, 20)} ({r.kind})
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {(["all", "failed", "unreviewed"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "全部" : f === "failed" ? "未通过" : "待复核"}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState
          title="加载失败"
          description={error}
          action={{ label: "重试", onClick: loadTrials }}
        />
      ) : filteredTrials.length === 0 ? (
        runs.length === 0 ? (
          <EmptyState
            heading="暂无评测运行"
            description="当前项目还没有已完成的评测运行。请先在 Agent / 记忆 / RAG 评测中发起一次运行，完成后即可在此复核样本。"
          />
        ) : (
          <EmptyState
            heading="暂无样本"
            description={
              filter === "unreviewed"
                ? "该运行的样本已全部复核完毕。"
                : filter === "failed"
                  ? "该运行没有未通过的样本。"
                  : "该运行暂无样本。"
            }
          />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          {/* Queue */}
          <div className="border-border bg-background max-h-[70vh] space-y-1 overflow-auto rounded border p-2">
            {filteredTrials.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelected(t);
                  setHumanPassed(t.human_evaluation?.human_passed ?? null);
                  setHumanScore(
                    t.human_evaluation?.human_score?.toString() ?? "",
                  );
                  setHumanNotes(t.human_evaluation?.human_notes ?? "");
                }}
                className={`w-full rounded px-2 py-1.5 text-left text-xs ${selected?.id === t.id ? "bg-accent-soft font-medium" : "hover:bg-muted"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{t.case_id}</span>
                  {t.passed === false && (
                    <Badge variant="destructive" className="ml-1 scale-75">
                      ✗
                    </Badge>
                  )}
                  {t.human_evaluation && (
                    <Badge variant="default" className="ml-1 scale-75">
                      ✓
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          <div className="border-border bg-card rounded border p-5">
            {selected ? (
              <div className="space-y-4">
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">样本 ID：</span>
                    <span className="font-mono">{selected.case_id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">维度：</span>
                    {selected.dimension ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">自动评判：</span>
                    {selected.passed === true
                      ? "通过"
                      : selected.passed === false
                        ? "未通过"
                        : "暂无"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">评分：</span>
                    {selected.score != null
                      ? Number(selected.score).toFixed(3)
                      : "—"}
                  </div>
                </div>
                <div className="space-y-2">
                  <DetailBlock
                    title="输入 / 问题"
                    data={
                      selected.input ??
                      selected.raw?.question ??
                      selected.raw?.input
                    }
                  />
                  <DetailBlock
                    title="期望答案"
                    data={
                      selected.expected ??
                      selected.raw?.expected_answer ??
                      selected.raw?.expected
                    }
                  />
                  <DetailBlock
                    title="系统 / 模型答案"
                    data={
                      selected.output ??
                      selected.raw?.system_answer ??
                      selected.raw?.answer
                    }
                  />
                  <DetailBlock
                    title="检索 / 记忆证据"
                    data={
                      selected.raw?.evidence ??
                      selected.raw?.retrieval ??
                      selected.raw?.memory_evidence
                    }
                  />
                </div>
                {selected.reasoning && (
                  <div className="border-border rounded border p-2 text-xs">
                    <span className="text-muted-foreground font-medium">
                      评判推理：
                    </span>
                    {selected.reasoning}
                  </div>
                )}

                {traceId ? (
                  <div className="space-y-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/project/${linkProject}/traces/${traceId}`}>
                        <ExternalLink className="mr-1 h-3 w-3" />
                        查看 Langfuse 追踪
                      </Link>
                    </Button>
                    {crossProject && traceProjectId && (
                      <p className="text-muted-foreground text-xs">
                        {crossProjectTraceHint(traceProjectId)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">暂无追踪链接</p>
                )}

                {/* Human eval form */}
                <div className="border-border space-y-3 border-t pt-4">
                  <p className="text-muted-foreground text-xs font-medium">
                    人工判定
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={humanPassed === true ? "default" : "outline"}
                      onClick={() => setHumanPassed(true)}
                    >
                      通过
                    </Button>
                    <Button
                      size="sm"
                      variant={humanPassed === null ? "default" : "outline"}
                      onClick={() => setHumanPassed(null)}
                    >
                      部分正确
                    </Button>
                    <Button
                      size="sm"
                      variant={humanPassed === false ? "default" : "outline"}
                      onClick={() => setHumanPassed(false)}
                    >
                      驳回
                    </Button>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={humanScore}
                    onChange={(e) => setHumanScore(e.target.value)}
                    placeholder="评分 (0-1)"
                    className="border-input bg-background w-32 rounded border px-2 py-1 text-sm"
                  />
                  <textarea
                    rows={3}
                    value={humanNotes}
                    onChange={(e) => setHumanNotes(e.target.value)}
                    placeholder="备注..."
                    className="border-input bg-background w-full rounded border px-3 py-2 text-sm"
                  />
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "提交中..." : "提交复核"}
                  </Button>
                  {selected.human_evaluation?.reviewer_name && (
                    <p className="text-muted-foreground text-xs">
                      上次复核：{selected.human_evaluation.reviewer_name}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                选择一个样本以查看详情并提交复核。
              </p>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}

function DetailBlock({ title, data }: { title: string; data: unknown }) {
  const text =
    data != null
      ? typeof data === "string"
        ? data
        : JSON.stringify(data, null, 2)
      : "暂无数据";
  return (
    <div className="border-border bg-muted rounded border p-2">
      <h4 className="text-muted-foreground mb-1 text-xs font-medium">
        {title}
      </h4>
      <pre className="max-h-28 overflow-auto text-xs whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  );
}
