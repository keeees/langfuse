import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { FileText, GitBranch, Zap, BarChart4 } from "lucide-react";

export function PromptsOnboarding({ projectId }: { projectId: string }) {
  const valuePropositions: ValueProposition[] = [
    {
      title: "Decoupled from code",
      description:
        "Deploy new prompts without application redeployment, making updates faster and easier",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: "Edit in UI or programmatically",
      description:
        "Non-technical users can easily edit prompts in the UI. Developers can optionally update prompts programmatically via the API and SDKs",
      icon: <GitBranch className="h-4 w-4" />,
    },
    {
      title: "Performance optimized",
      description:
        "Client-side caching prevents latency or availability issues for your applications",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: "Compare metrics",
      description:
        "Track latency, cost, and evaluation metrics across different prompt versions",
      icon: <BarChart4 className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title="Get Started with Prompt Management"
      description="EvalBear 提示词管理帮助您集中管理、版本控制并协作迭代提示词。开始使用提示词管理来提升 LLM 应用的性能和可维护性。"
      valuePropositions={valuePropositions}
      primaryAction={{
        label: "Create Prompt",
        href: `/project/${projectId}/prompts/new`,
      }}
      secondaryAction={{
        label: "Learn More",
        href: "https://langfuse.com/docs/prompt-management/get-started",
      }}
    />
  );
}
