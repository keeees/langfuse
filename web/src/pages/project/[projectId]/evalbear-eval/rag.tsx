import Page from "@/src/components/layouts/page";
import { Button } from "@/src/components/ui/button";
import { EmptyState, LoadingSkeleton } from "@/src/components/evalbear";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function RagEvalCreatePage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
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
      setConfigReady(data.status?.rag_eval === "ready");
    } catch {
      setConfigReady(false);
    } finally {
      setConfigLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <Page headerProps={{ title: "RAG 评测" }} scrollable withPadding>
      <Head>
        <title>RAG 评测 | EvalBear</title>
      </Head>
      <div className="mx-auto max-w-lg">
        {configLoading ? (
          <LoadingSkeleton />
        ) : configReady === false ? (
          <div className="border-destructive/40 bg-destructive/5 rounded-[var(--radius)] border p-4 text-sm">
            <p className="text-destructive font-medium">
              请先在「配置」中设置 Memory Config ID 和 Service API Key。
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href={`/project/${projectId}/evalbear-eval/config`}>
                前往配置
              </Link>
            </Button>
          </div>
        ) : (
          <div className="border-border bg-card rounded-[var(--radius)] border p-6 shadow-[var(--shadow-md)]">
            <EmptyState
              heading="RAG 评测即将推出"
              description="RAG 端到端评测功能正在开发中。配置就绪后将支持创建 RAG 评测运行。"
            />
          </div>
        )}
      </div>
    </Page>
  );
}
