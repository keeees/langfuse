import Header from "@/src/components/layouts/header";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { CodeBlock } from "@/src/components/ui/Codeblock";
import Link from "next/link";
import { Bot, SquareTerminal, Sparkles } from "lucide-react";

const DocsButton = ({ href }: { href: string }) => (
  <Button asChild variant="ghost">
    <Link href={href} target="_blank">
      Documentation ↗
    </Link>
  </Button>
);

export function DeveloperToolsSettings() {
  return (
    <div>
      <Header title="MCP & CLI" />
      <p className="text-muted-foreground mb-6 text-sm">
        将 EvalBear 引入您的终端和 AI 编码代理。这些工具让您和您的代理读写
        EvalBear 数据——追踪、提示词、数据集、评分等——无需离开开发环境。
      </p>
      <div className="space-y-6">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="text-foreground h-5 w-5" />
            <span className="font-semibold">Agent Skill</span>
          </div>
          <p className="text-primary mb-4 text-sm">
            EvalBear Agent Skill 是一个遵循 Anthropic Agent Skills
            标准的开源技能。 它为 AI 编码代理（Claude
            Code、Cursor、Windsurf）提供原生 EvalBear 能力，
            并引导代理遵循最佳实践，安装后代理能产出更好的结果。
          </p>
          <CodeBlock
            language="shell"
            value={`npx skills add langfuse/skills --skill "langfuse"`}
          />
          <div className="mt-4 flex items-center gap-2">
            <DocsButton href="https://langfuse.com/docs/api-and-data-platform/features/agent-skill" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bot className="text-foreground h-5 w-5" />
            <span className="font-semibold">MCP Server</span>
          </div>
          <p className="text-primary mb-4 text-sm">
            EvalBear MCP 服务器让 AI
            助手和代理通过模型上下文协议以编程方式与您的 EvalBear
            数据交互。它支持读写操作，您可以通过允许列表将其限制为只读访问。
            使用项目级 API 密钥对进行认证。
          </p>
          <CodeBlock
            language="shell"
            value={`claude mcp add --transport http langfuse \\
  https://cloud.langfuse.com/api/public/mcp \\
  --header "Authorization: Basic {your-base64-token}"`}
          />
          <div className="mt-4 flex items-center gap-2">
            <DocsButton href="https://langfuse.com/docs/api-and-data-platform/features/mcp-server" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <SquareTerminal className="text-foreground h-5 w-5" />
            <span className="font-semibold">CLI</span>
          </div>
          <p className="text-primary mb-4 text-sm">
            EvalBear CLI 提供对完整 EvalBear API 的终端访问。它封装了所有 API
            端点， 您可以直接从 shell
            或脚本管理追踪、提示词、数据集、评分和会话。 它使用与 EvalBear SDK
            相同的 API 密钥对。
          </p>
          <CodeBlock
            language="shell"
            value={`export LANGFUSE_PUBLIC_KEY="pk-lf-..."
export LANGFUSE_SECRET_KEY="sk-lf-..."

npx langfuse-cli api <resource> <action>`}
          />
          <div className="mt-4 flex items-center gap-2">
            <DocsButton href="https://langfuse.com/docs/api-and-data-platform/features/cli" />
          </div>
        </Card>
      </div>
    </div>
  );
}
