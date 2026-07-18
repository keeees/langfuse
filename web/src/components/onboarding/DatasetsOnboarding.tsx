import React from "react";
import {
  SplashScreen,
  type ValueProposition,
} from "@/src/components/ui/splash-screen";
import { Database, Beaker, Zap, Code } from "lucide-react";
import { DatasetActionButton } from "@/src/features/datasets/components/DatasetActionButton";

export function DatasetsOnboarding({ projectId }: { projectId: string }) {
  const valuePropositions: ValueProposition[] = [
    {
      title: "Continuous improvement",
      description:
        "Create datasets from production edge cases to improve your application",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: "Pre-deployment testing",
      description: "Benchmark new releases before deploying to production",
      icon: <Beaker className="h-4 w-4" />,
    },
    {
      title: "Structured testing",
      description:
        "Run experiments on collections of inputs and expected outputs",
      icon: <Database className="h-4 w-4" />,
    },
    {
      title: "Custom workflows",
      description:
        "Build custom workflows around your datasets via the API and SDKs, e.g. for fine-tuning, few-shotting",
      icon: <Code className="h-4 w-4" />,
    },
  ];

  return (
    <SplashScreen
      title="Get Started with Datasets & Experiments"
      description="EvalBear 中的数据集是 LLM 应用的输入（和预期输出）集合。您可以针对这些数据集运行实验，在部署到生产环境之前测试新版本。"
      valuePropositions={valuePropositions}
      primaryAction={{
        label: "Create Dataset",
        component: (
          <DatasetActionButton
            variant="default"
            mode="create"
            projectId={projectId}
            size="lg"
          />
        ),
      }}
      secondaryAction={{
        label: "Learn More",
        href: "https://langfuse.com/docs/datasets",
      }}
    />
  );
}
