import Page from "@/src/components/layouts/page";
import { OverviewTile } from "@/src/components/evalbear";
import {
  InvertedSection,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from "@/src/components/evalbear";
import { Button } from "@/src/components/ui/button";
import { api } from "@/src/utils/api";
import { useRouter } from "next/router";
import Link from "next/link";
import { Brain, BookOpen, ListTree, FileText } from "lucide-react";

export default function OverviewPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;

  return (
    <Page headerProps={{ title: "总览" }} scrollable withPadding>
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivityTile projectId={projectId} />
        <AgentHealthTile projectId={projectId} />
        <MemoryEvalTile projectId={projectId} />
        <QuickActionsTile projectId={projectId} />
      </div>
    </Page>
  );
}

function RecentActivityTile({ projectId }: { projectId: string }) {
  const traces = api.traces.all.useQuery(
    {
      projectId,
      page: 0,
      limit: 5,
      searchQuery: null,
      searchType: ["id"],
      filter: null,
      orderBy: { column: "timestamp", order: "DESC" },
    },
    { enabled: !!projectId, retry: false },
  );

  return (
    <OverviewTile label="最近活动" heading="最近活动">
      {traces.isLoading ? (
        <LoadingSkeleton />
      ) : traces.isError ? (
        <ErrorState
          title="加载失败"
          description="无法获取最近追踪数据。"
          action={{ label: "重试", onClick: () => traces.refetch() }}
        />
      ) : !traces.data?.traces?.length ? (
        <EmptyState
          heading="暂无活动"
          description="开始发送追踪数据以在此查看最近活动。"
        />
      ) : (
        <ul className="space-y-2">
          {traces.data.traces.slice(0, 5).map((trace) => (
            <li
              key={trace.id}
              className="border-border flex items-center justify-between rounded border px-3 py-2 text-xs"
            >
              <span className="text-foreground truncate font-mono">
                {(trace.name ?? trace.id).slice(0, 80)}
              </span>
              <span className="text-muted-foreground ml-2 shrink-0">
                {trace.timestamp
                  ? new Date(trace.timestamp).toLocaleString()
                  : "-"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </OverviewTile>
  );
}

function AgentHealthTile({ projectId }: { projectId: string }) {
  const traceCount = api.traces.countAll.useQuery(
    {
      projectId,
      searchQuery: null,
      searchType: [],
      filter: null,
      orderBy: null,
    },
    { enabled: !!projectId, retry: false },
  );

  const count = traceCount.data?.totalCount ?? 0;

  return (
    <OverviewTile label="AGENT 健康" heading="Agent 健康状态">
      {traceCount.isLoading ? (
        <LoadingSkeleton />
      ) : traceCount.isError ? (
        <ErrorState
          title="加载失败"
          description="无法获取健康状态数据。"
          action={{ label: "重试", onClick: () => traceCount.refetch() }}
        />
      ) : (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-foreground text-2xl font-bold">{count}</p>
            <p className="text-muted-foreground text-xs">追踪总数</p>
          </div>
          <div>
            <p className="text-foreground text-2xl font-bold">—</p>
            <p className="text-muted-foreground text-xs">错误率</p>
          </div>
          <div>
            <p className="text-foreground text-2xl font-bold">—</p>
            <p className="text-muted-foreground text-xs">平均延迟</p>
          </div>
        </div>
      )}
    </OverviewTile>
  );
}

function MemoryEvalTile({ projectId }: { projectId: string }) {
  return (
    <OverviewTile label="记忆评测" heading="记忆评测">
      <EmptyState
        heading="暂无评测运行"
        description="开始一次记忆评测以在此查看结果摘要。"
        action={{
          label: "开始评测",
          onClick: () => {
            window.location.href = `/project/${projectId}/evalbear-eval/memory`;
          },
        }}
      />
    </OverviewTile>
  );
}

function QuickActionsTile({ projectId }: { projectId: string }) {
  return (
    <OverviewTile label="快捷操作" heading="快速操作">
      <InvertedSection className="mt-1">
        <div className="grid grid-cols-2 gap-3">
          <Button
            asChild
            variant="ghost"
            className="text-background h-auto justify-start border border-white/[0.14] bg-white/[0.06] px-3 py-3 text-left hover:bg-white/[0.12]"
          >
            <Link href={`/project/${projectId}/evalbear-eval/memory`}>
              <Brain className="mr-2 h-4 w-4" />
              开始记忆评测
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="text-background h-auto justify-start border border-white/[0.14] bg-white/[0.06] px-3 py-3 text-left hover:bg-white/[0.12]"
          >
            <Link href={`/project/${projectId}/evalbear-eval/rag`}>
              <BookOpen className="mr-2 h-4 w-4" />
              开始 RAG 评测
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="text-background h-auto justify-start border border-white/[0.14] bg-white/[0.06] px-3 py-3 text-left hover:bg-white/[0.12]"
          >
            <Link href={`/project/${projectId}/traces`}>
              <ListTree className="mr-2 h-4 w-4" />
              打开追踪
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="text-background h-auto justify-start border border-white/[0.14] bg-white/[0.06] px-3 py-3 text-left hover:bg-white/[0.12]"
          >
            <Link href={`/project/${projectId}/evalbear-eval/reports`}>
              <FileText className="mr-2 h-4 w-4" />
              查看报告
            </Link>
          </Button>
        </div>
      </InvertedSection>
    </OverviewTile>
  );
}
