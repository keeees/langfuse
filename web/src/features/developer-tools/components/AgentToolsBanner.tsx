import { Callout } from "@/src/components/ui/callout";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
import { Bot } from "lucide-react";

const DOCS_HREF =
  "https://langfuse.com/docs/api-and-data-platform/features/agent-skill";

/**
 * Informational, dismissible banner that highlights EvalBear's support for AI
 * coding agents via the Agent Skill, MCP server, and CLI. Rendered on the
 * organization overview page.
 */
export function AgentToolsBanner() {
  return (
    <Callout
      className="mb-4"
      id="agent-tools-banner:v1"
      variant="info"
      align="middle"
      actions={() => (
        <Button asChild size="sm" variant="secondary">
          <Link href={DOCS_HREF} target="_blank">
            了解更多
          </Link>
        </Button>
      )}
    >
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">
            EvalBear 可与您的 AI 编码代理完美配合。
          </span>{" "}
          Connect Claude Code, Codex, and other agents to your data with the
          EvalBear Agent Skill、MCP 服务器和 CLI。
        </span>
      </div>
    </Callout>
  );
}
