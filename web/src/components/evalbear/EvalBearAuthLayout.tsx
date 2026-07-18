import type { PropsWithChildren } from "react";
import { CapabilityCard } from "./CapabilityCard";
import { LangfuseIcon } from "@/src/components/LangfuseLogo";

export function EvalBearAuthLayout({
  children,
  showBottomStrip = true,
}: PropsWithChildren<{ showBottomStrip?: boolean }>) {
  return (
    <div className="bg-background text-foreground relative flex min-h-dvh w-full min-w-0 flex-1 items-center justify-center overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="bg-accent/10 pointer-events-none absolute top-[-10rem] left-[-12rem] h-[28rem] w-[28rem] rounded-full blur-3xl" />
      <div className="bg-primary-accent/10 pointer-events-none absolute right-[-10rem] bottom-[-14rem] h-[32rem] w-[32rem] rounded-full blur-3xl" />

      <div className="bg-card/70 border-border relative grid w-full max-w-6xl overflow-hidden rounded-[32px] border shadow-[0_32px_90px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:min-h-[min(620px,calc(100dvh-2rem))] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="from-card via-muted/70 to-accent-soft border-border bg-gradient-to-br px-7 py-8 sm:px-10 lg:border-r lg:px-14 lg:py-12">
          <div className="flex h-full flex-col justify-between gap-8">
            <div className="space-y-7">
              <div className="flex items-center gap-3">
                <LangfuseIcon size={38} />
                <div>
                  <h1 className="font-display text-foreground text-3xl leading-none font-bold">
                    EvalBear
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Agent、模型、RAG 与记忆评测的一体化工作台
                  </p>
                </div>
              </div>

              <div className="max-w-md space-y-4">
                <p className="text-accent font-mono text-xs tracking-[0.16em] uppercase">
                  Unified Evaluation Workspace
                </p>
                <h2 className="font-display text-foreground text-4xl leading-tight sm:text-[2.75rem]">
                  统一入口，
                  <br />
                  <span className="from-accent to-primary-accent block bg-gradient-to-r bg-clip-text whitespace-nowrap text-transparent">
                    清晰分工
                  </span>
                </h2>
                <p className="text-muted-foreground text-sm leading-6">
                  Langfuse 专注 Agent 与模型观测，EvalBear 专注 RAG 与记忆评测。
                  团队从一个入口进入完整评测工作流。
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <CapabilityCard
                title="Agent 与模型"
                description="追踪、提示词、模型、实验"
              />
              <CapabilityCard
                title="RAG 与记忆评测"
                description="记忆评测、RAG 评测、样本复核、报告"
              />
            </div>
          </div>
        </section>

        <section className="bg-muted/40 flex min-h-[520px] flex-col items-center justify-center px-6 py-8 sm:px-10 lg:min-h-0 lg:px-16">
          <div className="w-full max-w-[460px]">{children}</div>
          {showBottomStrip && (
            <p className="text-muted-foreground mt-8 text-center text-xs">
              © {new Date().getFullYear()} EvalBear · 隐私政策 · 服务条款
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
