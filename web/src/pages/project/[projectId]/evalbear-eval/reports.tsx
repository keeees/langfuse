import Page from "@/src/components/layouts/page";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/src/components/evalbear";
import { Button } from "@/src/components/ui/button";
import { fetchAllTrials, fetchRuns } from "@/src/features/evalbear/api";
import type { EvalRunRecord, EvalTrial } from "@/src/features/evalbear/types";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

type ReportStats = {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  totalTrials: number;
  passedTrials: number;
  failedTrials: number;
  unclassifiedTrials: number;
  errorTrials: number;
  reviewedTrials: number;
  humanPassedTrials: number;
  humanFailedTrials: number;
};

const TRIAL_FETCH_CONCURRENCY = 5;

async function loadTrialsForRuns(
  projectId: string,
  runs: EvalRunRecord[],
): Promise<EvalTrial[]> {
  const trials: EvalTrial[] = [];

  for (let index = 0; index < runs.length; index += TRIAL_FETCH_CONCURRENCY) {
    const batch = runs.slice(index, index + TRIAL_FETCH_CONCURRENCY);
    const batchTrials = await Promise.all(
      batch.map((run) => fetchAllTrials(projectId, run.run_id)),
    );
    trials.push(...batchTrials.flat());
  }

  return trials;
}

function samplePassRate(stats: ReportStats): string {
  if (stats.totalTrials === 0) return "—";
  return `${((stats.passedTrials / stats.totalTrials) * 100).toFixed(1)}%`;
}

export default function ReportsPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { runs } = await fetchRuns(projectId);
      const trials = await loadTrialsForRuns(projectId, runs);
      setStats({
        totalRuns: runs.length,
        completedRuns: runs.filter((run) => run.status === "completed").length,
        failedRuns: runs.filter((run) => run.status === "failed").length,
        totalTrials: trials.length,
        passedTrials: trials.filter((trial) => trial.passed === true).length,
        failedTrials: trials.filter((trial) => trial.passed === false).length,
        unclassifiedTrials: trials.filter(
          (trial) => trial.passed !== true && trial.passed !== false,
        ).length,
        errorTrials: trials.filter((trial) => Boolean(trial.error?.trim()))
          .length,
        reviewedTrials: trials.filter((trial) => trial.human_evaluation != null)
          .length,
        humanPassedTrials: trials.filter(
          (trial) => trial.human_evaluation?.human_passed === true,
        ).length,
        humanFailedTrials: trials.filter(
          (trial) => trial.human_evaluation?.human_passed === false,
        ).length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const copyMarkdown = () => {
    if (!stats) return;
    const md = `# 评测报告\n\n- 总运行数：${stats.totalRuns}\n- 已完成运行：${stats.completedRuns}\n- 失败运行：${stats.failedRuns}\n- 样本通过率（通过样本 / 总样本）：${samplePassRate(stats)}\n- 样本总数：${stats.totalTrials}\n- 通过样本：${stats.passedTrials}\n- 未通过样本：${stats.failedTrials}\n- 未判定样本：${stats.unclassifiedTrials}\n- 错误样本：${stats.errorTrials}\n- 已人工复核：${stats.reviewedTrials}\n- 人工通过 / 驳回：${stats.humanPassedTrials} / ${stats.humanFailedTrials}`;
    navigator.clipboard.writeText(md);
  };

  const failureSummary = stats
    ? [
        stats.failedRuns > 0 ? `运行失败 ${stats.failedRuns}` : null,
        stats.failedTrials > 0 ? `样本未通过 ${stats.failedTrials}` : null,
        stats.errorTrials > 0 ? `执行错误 ${stats.errorTrials}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "无"
    : "无";

  return (
    <Page headerProps={{ title: "报告" }} scrollable withPadding>
      <Head>
        <title>报告 | EvalBear</title>
      </Head>
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState
          title="加载失败"
          description={error}
          action={{ label: "重试", onClick: fetchStats }}
        />
      ) : !stats || stats.totalRuns === 0 ? (
        <EmptyState
          heading="暂无报告数据"
          description="完成评测运行后，报告将自动生成。"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-border bg-card rounded-[var(--radius)] border p-4 text-center shadow-[var(--shadow-md)]">
              <p className="text-2xl font-bold">{stats.totalRuns}</p>
              <p className="text-muted-foreground text-xs">总运行数</p>
            </div>
            <div className="border-border bg-card rounded-[var(--radius)] border p-4 text-center shadow-[var(--shadow-md)]">
              <p className="text-success text-2xl font-bold">
                {stats.completedRuns}
              </p>
              <p className="text-muted-foreground text-xs">已完成运行</p>
            </div>
            <div className="border-border bg-card rounded-[var(--radius)] border p-4 text-center shadow-[var(--shadow-md)]">
              <p className="text-danger text-2xl font-bold">
                {stats.failedRuns}
              </p>
              <p className="text-muted-foreground text-xs">失败运行</p>
            </div>
            <div className="border-border bg-card rounded-[var(--radius)] border p-4 text-center shadow-[var(--shadow-md)]">
              <p className="text-2xl font-bold">{samplePassRate(stats)}</p>
              <p className="text-muted-foreground text-xs">样本通过率</p>
              <p className="text-muted-foreground mt-0.5 text-[10px]">
                通过样本 / 总样本
              </p>
            </div>
          </div>
          <div className="border-border bg-card rounded-[var(--radius)] border p-4">
            <h3 className="mb-3 text-sm font-semibold">详细指标</h3>
            <div className="grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
              <div className="border-border flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">样本总数</span>
                <span className="font-mono">{stats.totalTrials}</span>
              </div>
              <div className="border-border flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">通过样本</span>
                <span className="font-mono">{stats.passedTrials}</span>
              </div>
              <div className="border-border flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">未通过样本</span>
                <span className="font-mono">{stats.failedTrials}</span>
              </div>
              <div className="border-border flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">未判定样本</span>
                <span className="font-mono">{stats.unclassifiedTrials}</span>
              </div>
              <div className="border-border flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">错误样本数</span>
                <span className="font-mono">{stats.errorTrials}</span>
              </div>
              <div className="border-border flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">已人工复核</span>
                <span className="font-mono">
                  {stats.reviewedTrials} / {stats.totalTrials}
                </span>
              </div>
              <div className="border-border flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">人工通过 / 驳回</span>
                <span className="font-mono">
                  {stats.humanPassedTrials} / {stats.humanFailedTrials}
                </span>
              </div>
              <div className="border-border flex justify-between gap-4 border-b py-1.5">
                <span className="text-muted-foreground shrink-0">失败摘要</span>
                <span className="text-right font-mono">{failureSummary}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyMarkdown}>
              复制 Markdown
            </Button>
          </div>
        </div>
      )}
    </Page>
  );
}
