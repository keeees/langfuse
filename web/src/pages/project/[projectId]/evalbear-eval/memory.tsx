import Page from "@/src/components/layouts/page";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import {
  ErrorState,
  LoadingSkeleton,
  LoadingSpinner,
} from "@/src/components/evalbear";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function MemoryEvalCreatePage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [benchmark, setBenchmark] = useState("longmemeval");
  const [startIndex, setStartIndex] = useState(0);
  const [limit, setLimit] = useState(10);
  const [enableLLMJudge, setEnableLLMJudge] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configReady, setConfigReady] = useState<boolean | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    if (!projectId) return;
    setConfigLoading(true);
    try {
      const res = await fetch(
        `/api/redbear/eval/projects/${projectId}/config?projectId=${projectId}`,
      );
      if (!res.ok) {
        setConfigReady(false);
        return;
      }
      const data = await res.json();
      setConfigReady(data.status?.memory_eval === "ready");
      if (data.memory_default_benchmark)
        setBenchmark(data.memory_default_benchmark);
      if (data.default_limit) setLimit(data.default_limit);
      if (data.default_start_index != null)
        setStartIndex(data.default_start_index);
      if (data.default_no_llm_judge != null)
        setEnableLLMJudge(!data.default_no_llm_judge);
    } catch {
      setConfigReady(false);
    } finally {
      setConfigLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/redbear/eval/runs?projectId=${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runner_id: "memory_eval",
          config: {
            benchmark,
            start_index: startIndex,
            limit,
            no_llm_judge: !enableLLMJudge,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? `请求失败 (${res.status})`);
      }
      const data = await res.json();
      router.push(
        `/project/${projectId}/evalbear-eval/history?run=${data.run_id ?? ""}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page headerProps={{ title: "记忆评测" }} scrollable withPadding>
      <Head>
        <title>记忆评测 | EvalBear</title>
      </Head>
      <div className="mx-auto max-w-lg">
        {configLoading ? (
          <LoadingSkeleton />
        ) : configReady === false ? (
          <div className="border-destructive/40 bg-destructive/5 rounded-[var(--radius)] border p-4 text-sm">
            <p className="text-destructive font-medium">
              请先在「配置」中设置 Memory Config ID。
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href={`/project/${projectId}/evalbear-eval/config`}>
                前往配置
              </Link>
            </Button>
          </div>
        ) : (
          <div className="border-border bg-card rounded-[var(--radius)] border p-6 shadow-[var(--shadow-md)]">
            {error && (
              <ErrorState
                title="提交失败"
                description={error}
                action={{ label: "重试", onClick: () => setError(null) }}
              />
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="benchmark">基准测试</Label>
                <select
                  id="benchmark"
                  value={benchmark}
                  onChange={(e) => setBenchmark(e.target.value)}
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="longmemeval">LongMemEval</option>
                  <option value="locomo">LoCoMo</option>
                  <option value="memsciqa">MemSciQA</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startIndex">起始索引</Label>
                <Input
                  id="startIndex"
                  type="number"
                  min={0}
                  value={startIndex}
                  onChange={(e) => setStartIndex(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">数量限制</Label>
                <Input
                  id="limit"
                  type="number"
                  min={1}
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="llmJudge">启用 LLM 评判</Label>
                <Switch
                  id="llmJudge"
                  checked={enableLLMJudge}
                  onCheckedChange={setEnableLLMJudge}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner /> : "开始评测"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </Page>
  );
}
