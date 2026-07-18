import Page from "@/src/components/layouts/page";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Badge } from "@/src/components/ui/badge";
import { LoadingSkeleton, ErrorState } from "@/src/components/evalbear";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Head from "next/head";

type ConfigData = {
  base_url: string;
  api_format: string;
  api_key_set: boolean;
  service_api_base_url: string;
  service_api_key_set: boolean;
  memory_config_id: string;
  default_end_user_id: string;
  judge_enabled_default: boolean;
  judge_model: string;
  judge_base_url: string;
  judge_api_key_set: boolean;
  agent_default_dataset_path: string;
  memory_default_benchmark: string;
  memory_default_dataset_path: string;
  rag_default_dataset_path: string;
  default_limit: number;
  default_start_index: number;
  default_no_llm_judge: boolean;
  status: Record<string, string>;
};

type CheckResult = {
  eval_service: string;
  agent_chat: string;
  service_api: string;
  memory_config: string;
  messages: string[];
};

export default function EvalConfigPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Form state
  const [baseUrl, setBaseUrl] = useState("");
  const [apiFormat, setApiFormat] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [serviceApiBaseUrl, setServiceApiBaseUrl] = useState("");
  const [serviceApiKey, setServiceApiKey] = useState("");
  const [memoryConfigId, setMemoryConfigId] = useState("");
  const [defaultEndUserId, setDefaultEndUserId] = useState("");
  const [judgeEnabled, setJudgeEnabled] = useState(true);
  const [judgeModel, setJudgeModel] = useState("");
  const [judgeBaseUrl, setJudgeBaseUrl] = useState("");
  const [judgeApiKey, setJudgeApiKey] = useState("");
  const [agentDatasetPath, setAgentDatasetPath] = useState("");
  const [memoryBenchmark, setMemoryBenchmark] = useState("longmemeval");
  const [memoryDatasetPath, setMemoryDatasetPath] = useState("");
  const [ragDatasetPath, setRagDatasetPath] = useState("");
  const [defaultLimit, setDefaultLimit] = useState(10);
  const [defaultStartIndex, setDefaultStartIndex] = useState(0);

  const fetchConfig = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/redbear/eval/projects/${projectId}/config?projectId=${projectId}`,
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data: ConfigData = await res.json();
      setConfig(data);
      setBaseUrl(data.base_url);
      setApiFormat(data.api_format);
      setServiceApiBaseUrl(data.service_api_base_url);
      setMemoryConfigId(data.memory_config_id);
      setDefaultEndUserId(data.default_end_user_id);
      setJudgeEnabled(data.judge_enabled_default);
      setJudgeModel(data.judge_model);
      setJudgeBaseUrl(data.judge_base_url);
      setAgentDatasetPath(data.agent_default_dataset_path);
      setMemoryBenchmark(data.memory_default_benchmark);
      setMemoryDatasetPath(data.memory_default_dataset_path);
      setRagDatasetPath(data.rag_default_dataset_path);
      setDefaultLimit(data.default_limit);
      setDefaultStartIndex(data.default_start_index);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        base_url: baseUrl,
        api_format: apiFormat,
        service_api_base_url: serviceApiBaseUrl,
        memory_config_id: memoryConfigId,
        default_end_user_id: defaultEndUserId,
        judge_enabled_default: judgeEnabled,
        judge_model: judgeModel,
        judge_base_url: judgeBaseUrl,
        agent_default_dataset_path: agentDatasetPath,
        memory_default_benchmark: memoryBenchmark,
        memory_default_dataset_path: memoryDatasetPath,
        rag_default_dataset_path: ragDatasetPath,
        default_limit: defaultLimit,
        default_start_index: defaultStartIndex,
      };
      if (apiKey) body.api_key = apiKey;
      if (serviceApiKey) body.service_api_key = serviceApiKey;
      if (judgeApiKey) body.judge_api_key = judgeApiKey;

      const res = await fetch(
        `/api/redbear/eval/projects/${projectId}/config?projectId=${projectId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error(`保存失败 (${res.status})`);
      setApiKey("");
      setServiceApiKey("");
      setJudgeApiKey("");
      await fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheck = async () => {
    setIsChecking(true);
    setCheckResult(null);
    const fail = (messages: string[]): CheckResult => ({
      eval_service: "error",
      agent_chat: "unknown",
      service_api: "unknown",
      memory_config: "unknown",
      messages,
    });
    try {
      const res = await fetch(
        `/api/redbear/eval/projects/${projectId}/config/check?projectId=${projectId}`,
        { method: "POST" },
      );
      if (res.ok) {
        setCheckResult(await res.json());
        return;
      }
      // Non-2xx: surface the real HTTP status + backend detail instead of a
      // generic "连接检查失败", so 401 (auth) vs 502 (unreachable) vs 404
      // (missing route) are distinguishable at a glance.
      let detail = "";
      try {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const body = await res.json();
          const err = typeof body?.error === "string" ? body.error : "";
          const det = typeof body?.detail === "string" ? body.detail : "";
          detail = err && det && err !== det ? `${err}: ${det}` : det || err;
        } else {
          detail = (await res.text()).slice(0, 200);
        }
      } catch {
        // Body unreadable — the status code alone is still informative.
      }
      const hint =
        res.status === 401
          ? "鉴权失败：eval-service 拒绝了请求（EVAL_SERVICE_INTERNAL_TOKEN 缺失/不匹配，或来源不被信任）。"
          : res.status === 403
            ? "无权限：当前用户缺少该项目的 evalJob 权限。"
            : res.status === 404
              ? "接口不存在：eval-service 版本可能过旧，或路径未注册。"
              : res.status === 502
                ? "eval-service 不可达：确认 EVAL_SERVICE_WEB_URL 指向正在运行的服务。"
                : res.status >= 500
                  ? "eval-service 内部错误，请查看其日志。"
                  : "";
      const messages = [`连接检查失败 (HTTP ${res.status})`];
      if (detail) messages.push(detail);
      if (hint) messages.push(hint);
      setCheckResult(fail(messages));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCheckResult(fail([`连接检查失败：无法连接到评测服务代理 (${msg})`]));
    } finally {
      setIsChecking(false);
    }
  };

  const statusBadge = (s: string) => {
    if (s === "ok" || s === "ready")
      return <Badge variant="default">就绪</Badge>;
    // "optional" = not required (e.g. Memory Config ID resolves to the
    // workspace default server-side). Render neutrally, not as an error.
    if (s === "optional") return <Badge variant="secondary">可选</Badge>;
    return (
      <Badge variant="destructive">
        {s === "not_configured" ? "未配置" : s.replace("missing_", "缺少 ")}
      </Badge>
    );
  };

  return (
    <Page headerProps={{ title: "配置" }} scrollable withPadding>
      <Head>
        <title>配置 | EvalBear</title>
      </Head>
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState
          title="加载失败"
          description={error}
          action={{ label: "重试", onClick: fetchConfig }}
        />
      ) : (
        <div className="space-y-6">
          {/* Status */}
          {config && (
            <div className="border-border bg-card rounded-[var(--radius)] border p-5">
              <h3 className="mb-3 text-sm font-semibold">配置状态</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  Agent 评测 {statusBadge(config.status.agent_eval)}
                </div>
                <div className="flex items-center gap-2">
                  记忆评测 {statusBadge(config.status.memory_eval)}
                </div>
                <div className="flex items-center gap-2">
                  RAG 评测 {statusBadge(config.status.rag_eval)}
                </div>
              </div>
            </div>
          )}

          {/* Agent Service */}
          <div className="border-border bg-card rounded-[var(--radius)] border p-5">
            <h3 className="mb-4 text-sm font-semibold">被测 Agent 服务</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Base URL</Label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://devmemorybear.redbearai.com"
                />
              </div>
              <div className="space-y-1">
                <Label>API 格式</Label>
                <select
                  value={apiFormat}
                  onChange={(e) => setApiFormat(e.target.value)}
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">选择格式</option>
                  <option value="memorybear">MemoryBear</option>
                  <option value="openai_compatible">OpenAI Compatible</option>
                  <option value="fastgpt">FastGPT</option>
                </select>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label>API Key</Label>
                  {config?.api_key_set ? (
                    <Badge variant="default">已设置</Badge>
                  ) : (
                    <Badge variant="secondary">未设置</Badge>
                  )}
                </div>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="留空表示不修改已保存密钥"
                />
              </div>
            </div>
          </div>

          {/* Memory/RAG Service */}
          <div className="border-border bg-card rounded-[var(--radius)] border p-5">
            <h3 className="mb-4 text-sm font-semibold">Memory / RAG 服务</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Service API Base URL</Label>
                <Input
                  value={serviceApiBaseUrl}
                  onChange={(e) => setServiceApiBaseUrl(e.target.value)}
                  placeholder="留空则使用 Agent Base URL"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label>Service API Key</Label>
                  {config?.service_api_key_set ? (
                    <Badge variant="default">已设置</Badge>
                  ) : (
                    <Badge variant="secondary">未设置</Badge>
                  )}
                </div>
                <Input
                  type="password"
                  value={serviceApiKey}
                  onChange={(e) => setServiceApiKey(e.target.value)}
                  placeholder="留空表示不修改已保存密钥"
                />
              </div>
              <div className="space-y-1">
                <Label>Memory Config ID（可选）</Label>
                <Input
                  value={memoryConfigId}
                  onChange={(e) => setMemoryConfigId(e.target.value)}
                  placeholder="留空则使用 workspace 默认配置"
                />
              </div>
              <div className="space-y-1">
                <Label>默认 End User ID</Label>
                <Input
                  value={defaultEndUserId}
                  onChange={(e) => setDefaultEndUserId(e.target.value)}
                  placeholder="可选"
                />
              </div>
            </div>
          </div>

          {/* Judge LLM */}
          <div className="border-border bg-card rounded-[var(--radius)] border p-5">
            <h3 className="mb-4 text-sm font-semibold">Judge LLM</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>默认启用 LLM 评判</Label>
                <Switch
                  checked={judgeEnabled}
                  onCheckedChange={setJudgeEnabled}
                />
              </div>
              <div className="space-y-1">
                <Label>Judge 模型</Label>
                <Input
                  value={judgeModel}
                  onChange={(e) => setJudgeModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                />
              </div>
              <div className="space-y-1">
                <Label>Judge Base URL</Label>
                <Input
                  value={judgeBaseUrl}
                  onChange={(e) => setJudgeBaseUrl(e.target.value)}
                  placeholder="可选，留空使用默认"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label>Judge API Key</Label>
                  {config?.judge_api_key_set ? (
                    <Badge variant="default">已设置</Badge>
                  ) : (
                    <Badge variant="secondary">未设置</Badge>
                  )}
                </div>
                <Input
                  type="password"
                  value={judgeApiKey}
                  onChange={(e) => setJudgeApiKey(e.target.value)}
                  placeholder="留空表示不修改已保存密钥"
                />
              </div>
            </div>
          </div>

          {/* Runner Defaults */}
          <div className="border-border bg-card rounded-[var(--radius)] border p-5">
            <h3 className="mb-4 text-sm font-semibold">Runner 默认值</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Agent 默认数据集路径</Label>
                <Input
                  value={agentDatasetPath}
                  onChange={(e) => setAgentDatasetPath(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Memory 默认 Benchmark</Label>
                <select
                  value={memoryBenchmark}
                  onChange={(e) => setMemoryBenchmark(e.target.value)}
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="longmemeval">LongMemEval</option>
                  <option value="locomo">LoCoMo</option>
                  <option value="memsciqa">MemSciQA</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Memory 默认数据集路径</Label>
                <Input
                  value={memoryDatasetPath}
                  onChange={(e) => setMemoryDatasetPath(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>RAG 默认数据集路径</Label>
                <Input
                  value={ragDatasetPath}
                  onChange={(e) => setRagDatasetPath(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>默认数量限制</Label>
                <Input
                  type="number"
                  min={1}
                  value={defaultLimit}
                  onChange={(e) => setDefaultLimit(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label>默认起始索引</Label>
                <Input
                  type="number"
                  min={0}
                  value={defaultStartIndex}
                  onChange={(e) => setDefaultStartIndex(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "保存中..." : "保存配置"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCheck}
              disabled={isChecking}
            >
              {isChecking ? "检查中..." : "测试连接"}
            </Button>
          </div>

          {/* Check Result */}
          {checkResult && (
            <div className="border-border bg-card rounded-[var(--radius)] border p-5">
              <h3 className="mb-3 text-sm font-semibold">连接检查结果</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>评测服务</span>
                  {statusBadge(checkResult.eval_service)}
                </div>
                <div className="flex justify-between">
                  <span>Agent Chat</span>
                  {statusBadge(checkResult.agent_chat)}
                </div>
                <div className="flex justify-between">
                  <span>Service API</span>
                  {statusBadge(checkResult.service_api)}
                </div>
                <div className="flex justify-between">
                  <span>Memory 配置</span>
                  {statusBadge(checkResult.memory_config)}
                </div>
              </div>
              {checkResult.messages.length > 0 && (
                <ul className="text-muted-foreground mt-3 space-y-1 text-xs">
                  {checkResult.messages.map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <p className="text-muted-foreground text-xs">
            这些项目级配置会由 EvalBear
            后端在运行评测时注入，不会随单次运行配置明文保存。
          </p>
        </div>
      )}
    </Page>
  );
}
