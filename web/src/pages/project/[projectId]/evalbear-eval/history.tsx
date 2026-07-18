import Page from "@/src/components/layouts/page";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/src/components/evalbear";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Head from "next/head";

type RunRecord = {
  run_id: string;
  status: string;
  kind?: string;
  created_at?: string;
  summary?: Record<string, unknown> | null;
};

export default function RunHistoryPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/redbear/eval/runs?projectId=${projectId}`);
      if (!res.ok) throw new Error(`请求失败 (${res.status})`);
      const data = await res.json();
      setRuns(data.runs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  return (
    <Page headerProps={{ title: "运行历史" }} scrollable withPadding>
      <Head>
        <title>运行历史 | EvalBear</title>
      </Head>
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState
          title="加载失败"
          description={error}
          action={{ label: "重试", onClick: fetchRuns }}
        />
      ) : runs.length === 0 ? (
        <EmptyState
          heading="暂无运行记录"
          description="开始一次评测后，运行记录将在此显示。"
        />
      ) : (
        <>
          <div className="border-border bg-background rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>运行 ID</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => {
                  const kindLabel =
                    run.kind === "agent"
                      ? "Agent 评测"
                      : run.kind === "memory"
                        ? "记忆评测"
                        : run.kind === "rag"
                          ? "RAG 评测"
                          : (run.kind ?? "-");
                  const isHighlighted = router.query.run === run.run_id;
                  return (
                    <TableRow
                      key={run.run_id}
                      className={`cursor-pointer ${isHighlighted ? "bg-accent-soft" : ""}`}
                      onClick={() =>
                        router.push(
                          `/project/${projectId}/evalbear-eval/runs/${run.run_id}`,
                        )
                      }
                    >
                      <TableCell className="truncate font-mono">
                        {run.run_id}
                      </TableCell>
                      <TableCell>{kindLabel}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        {run.created_at
                          ? new Date(run.created_at).toLocaleString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {router.query.run &&
            runs.find(
              (r) => r.run_id === router.query.run && r.kind === "agent",
            ) && (
              <p className="text-muted-foreground mt-3 text-xs">
                Agent 评测结果已同步到 Langfuse 追踪，可在样本复核中查看单条
                case 的 trace。
              </p>
            )}
        </>
      )}
    </Page>
  );
}
