import Page from "@/src/components/layouts/page";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/src/components/evalbear";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Head from "next/head";

export default function ReportsPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [stats, setStats] = useState<{
    total: number;
    passed: number;
    failed: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/redbear/eval/runs?projectId=${projectId}`);
      if (!res.ok) throw new Error(`请求失败 (${res.status})`);
      const data = await res.json();
      const runs = data.runs ?? [];
      const total = runs.length;
      const passed = runs.filter(
        (r: { status: string }) => r.status === "completed",
      ).length;
      const failed = runs.filter(
        (r: { status: string }) => r.status === "failed",
      ).length;
      setStats({ total, passed, failed });
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
    const md = `# 评测报告\n\n- 总运行数：${stats.total}\n- 完成：${stats.passed}\n- 失败：${stats.failed}\n- 通过率：${stats.total ? ((stats.passed / stats.total) * 100).toFixed(1) : 0}%`;
    navigator.clipboard.writeText(md);
  };

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
      ) : !stats || stats.total === 0 ? (
        <EmptyState
          heading="暂无报告数据"
          description="完成评测运行后，报告将自动生成。"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-border bg-card rounded-[var(--radius)] border p-4 text-center shadow-[var(--shadow-md)]">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-muted-foreground text-xs">总运行数</p>
            </div>
            <div className="border-border bg-card rounded-[var(--radius)] border p-4 text-center shadow-[var(--shadow-md)]">
              <p className="text-success text-2xl font-bold">{stats.passed}</p>
              <p className="text-muted-foreground text-xs">完成</p>
            </div>
            <div className="border-border bg-card rounded-[var(--radius)] border p-4 text-center shadow-[var(--shadow-md)]">
              <p className="text-danger text-2xl font-bold">{stats.failed}</p>
              <p className="text-muted-foreground text-xs">失败</p>
            </div>
            <div className="border-border bg-card rounded-[var(--radius)] border p-4 text-center shadow-[var(--shadow-md)]">
              <p className="text-2xl font-bold">
                {stats.total > 0
                  ? `${((stats.passed / stats.total) * 100).toFixed(1)}%`
                  : "—"}
              </p>
              <p className="text-muted-foreground text-xs">通过率</p>
            </div>
          </div>
          <div className="border-border bg-card rounded-[var(--radius)] border p-4">
            <h3 className="mb-3 text-sm font-semibold">详细指标</h3>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div className="border-border flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">样本总数</span>
                <span className="font-mono">暂无数据</span>
              </div>
              <div className="border-border flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">错误样本数</span>
                <span className="font-mono">暂无数据</span>
              </div>
              <div className="border-border flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">失败类型摘要</span>
                <span className="font-mono">暂无数据</span>
              </div>
              <div className="border-border flex justify-between border-b py-1.5">
                <span className="text-muted-foreground">低置信样本</span>
                <span className="font-mono">暂无数据</span>
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
