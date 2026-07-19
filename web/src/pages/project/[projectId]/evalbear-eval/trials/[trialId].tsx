import Page from "@/src/components/layouts/page";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { LoadingSkeleton, ErrorState } from "@/src/components/evalbear";
import { fetchTrial, submitHumanEval } from "@/src/features/evalbear/api";
import type {
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
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function TrialDetailPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const trialId = router.query.trialId as string;
  const [trial, setTrial] = useState<EvalTrial | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [humanPassed, setHumanPassed] = useState<boolean | null>(null);
  const [humanScore, setHumanScore] = useState("");
  const [humanNotes, setHumanNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!projectId || !trialId) return;
    setIsLoading(true);
    setError(null);
    try {
      const t = await fetchTrial(projectId, trialId);
      setTrial(t);
      if (t.human_evaluation) {
        setHumanPassed(t.human_evaluation.human_passed ?? null);
        setHumanScore(t.human_evaluation.human_score?.toString() ?? "");
        setHumanNotes(t.human_evaluation.human_notes ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, trialId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!trial) return;
    setSubmitting(true);
    try {
      const body: HumanEvalRequest = {
        human_passed: humanPassed,
        human_score: humanScore ? Number(humanScore) : null,
        human_notes: humanNotes || null,
      };
      await submitHumanEval(projectId, trial.id, body);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const {
    traceId,
    traceProjectId,
    linkProject: traceLinkProject,
    crossProject: traceCrossProject,
  } = getTraceLink(trial?.raw, projectId);

  return (
    <Page headerProps={{ title: "样本详情" }} scrollable withPadding>
      <Head>
        <title>样本详情 | EvalBear</title>
      </Head>
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState
          title="加载失败"
          description={error}
          action={{ label: "重试", onClick: load }}
        />
      ) : !trial ? (
        <ErrorState title="样本未找到" />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link
                href={`/project/${projectId}/evalbear-eval/runs/${trial.run_id}`}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回运行
              </Link>
            </Button>
            <span className="text-muted-foreground font-mono text-xs">
              {trial.case_id}
            </span>
            <Badge
              variant={
                trial.passed === true
                  ? "default"
                  : trial.passed === false
                    ? "destructive"
                    : "secondary"
              }
            >
              {trial.passed === true
                ? "通过"
                : trial.passed === false
                  ? "未通过"
                  : "待评"}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <span className="text-muted-foreground">维度：</span>
              {trial.dimension ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">评分：</span>
              {trial.score != null ? Number(trial.score).toFixed(3) : "—"}
            </div>
            <div>
              <span className="text-muted-foreground">延迟：</span>
              {trial.latency_ms != null
                ? `${trial.latency_ms.toFixed(0)} ms`
                : "—"}
            </div>
          </div>

          {/* Content sections */}
          <div className="space-y-3">
            <Section title="输入 / 问题" content={trial.input} />
            <Section title="期望答案" content={trial.expected} />
            <Section title="系统 / 模型输出" content={trial.output} />
            {trial.reasoning && (
              <div className="border-border rounded border p-3">
                <h4 className="text-muted-foreground mb-1 text-xs font-medium">
                  评判推理
                </h4>
                <p className="text-sm">{trial.reasoning}</p>
              </div>
            )}
          </div>

          {/* Trace link */}
          {traceId ? (
            <div className="space-y-1">
              <Button asChild variant="outline" size="sm">
                <Link href={`/project/${traceLinkProject}/traces/${traceId}`}>
                  <ExternalLink className="mr-1 h-3 w-3" />
                  查看 Langfuse 追踪
                </Link>
              </Button>
              {traceCrossProject && traceProjectId && (
                <p className="text-muted-foreground text-xs">
                  {crossProjectTraceHint(traceProjectId)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">暂无追踪链接</p>
          )}

          {/* Raw JSON */}
          {trial.raw && (
            <details>
              <summary className="text-muted-foreground cursor-pointer text-xs">
                查看原始数据
              </summary>
              <pre className="bg-muted mt-2 max-h-60 overflow-auto rounded p-3 text-xs">
                {JSON.stringify(trial.raw, null, 2)}
              </pre>
            </details>
          )}

          {/* Human evaluation form */}
          <div className="border-border bg-card rounded border p-4">
            <h3 className="mb-3 text-sm font-semibold">人工复核</h3>
            {trial.human_evaluation?.reviewer_name && (
              <p className="text-muted-foreground mb-2 text-xs">
                上次复核者：{trial.human_evaluation.reviewer_name}
              </p>
            )}
            <div className="space-y-3">
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
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

function Section({ title, content }: { title: string; content: unknown }) {
  const text =
    content != null
      ? typeof content === "string"
        ? content
        : JSON.stringify(content, null, 2)
      : "暂无数据";
  return (
    <div className="border-border rounded border p-3">
      <h4 className="text-muted-foreground mb-1 text-xs font-medium">
        {title}
      </h4>
      <pre className="max-h-40 overflow-auto text-xs whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  );
}
