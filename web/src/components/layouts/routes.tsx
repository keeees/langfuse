import { type Flag } from "@/src/features/feature-flags/types";
import { type ProjectScope } from "@/src/features/rbac/constants/projectAccessRights";
import {
  Database,
  LayoutDashboard,
  ListTree,
  type LucideIcon,
  Settings,
  UsersIcon,
  TerminalIcon,
  Grid2X2,
  Sparkle,
  FileJson,
  Search,
  Home,
  SquarePercent,
  Clock,
  Beaker,
  ClipboardCheck,
  Brain,
  BookOpen,
  History,
  FileText,
  Cog,
  Eye,
} from "lucide-react";
import { type ReactNode } from "react";
import { type Entitlement } from "@/src/features/entitlements/constants/entitlements";
import { type User } from "next-auth";
import { type OrganizationScope } from "@/src/features/rbac/constants/organizationAccessRights";
import { InAppAiAgentButton } from "@/src/components/nav/in-app-ai-agent-button";
import { V4SidebarToggle } from "@/src/features/events/components/V4SidebarToggle";
import { SidebarMenuButton } from "@/src/components/ui/sidebar";
import { KeyboardShortcut } from "@/src/components/ui/keyboard-shortcut";
import { useCommandMenu } from "@/src/features/command-k-menu/CommandMenuProvider";
import { usePostHogClientCapture } from "@/src/features/posthog-analytics/usePostHogClientCapture";
import { CloudStatusMenu } from "@/src/features/cloud-status-notification/components/CloudStatusMenu";
import { type ProductModule } from "@/src/ee/features/ui-customization/productModuleSchema";

export enum RouteSection {
  Main = "main",
  Secondary = "secondary",
}

export enum RouteGroup {
  Overview = "总览",
  AgentAndModel = "Agent 观测",
  RagAndMemory = "评测中心",
  Settings = "设置",
}

export type Route = {
  title: string;
  menuNode?: ReactNode;
  featureFlag?: Flag;
  label?: string | ReactNode;
  projectRbacScopes?: ProjectScope[]; // array treated as OR
  organizationRbacScope?: OrganizationScope;
  icon?: LucideIcon; // ignored for nested routes
  pathname: string; // link
  items?: Array<Route>; // folder
  section?: RouteSection; // which section of the sidebar (top/main/bottom)
  newTab?: boolean; // open in new tab
  entitlements?: Entitlement[]; // entitlements required, array treated as OR
  productModule?: ProductModule; // Product module this route belongs to. Used to show/hide modules via ui customization.
  show?: (p: {
    organization: User["organizations"][number] | undefined;
    projectId: string | undefined;
    isLangfuseCloud: boolean;
  }) => boolean;
  group?: RouteGroup; // group this route belongs to (within a section)
};

export const ROUTES: Route[] = [
  {
    title: "跳转到...",
    pathname: "", // Empty pathname since this is a dropdown
    icon: Search,
    menuNode: <CommandMenuTrigger />,
    section: RouteSection.Main,
  },
  {
    title: "组织",
    pathname: "/",
    icon: Grid2X2,
    show: ({ organization }) => organization === undefined,
    section: RouteSection.Main,
  },
  {
    title: "项目",
    pathname: "/organization/[organizationId]",
    icon: Grid2X2,
    section: RouteSection.Main,
  },
  {
    title: "首页",
    pathname: `/project/[projectId]`,
    icon: Home,
    section: RouteSection.Main,
  },
  // ── 总览 ──
  {
    title: "总览",
    pathname: `/project/[projectId]/overview`,
    icon: LayoutDashboard,
    group: RouteGroup.Overview,
    section: RouteSection.Main,
  },
  // ── Agent 与模型 ──
  {
    title: "追踪",
    icon: ListTree,
    productModule: "tracing",
    group: RouteGroup.AgentAndModel,
    section: RouteSection.Main,
    pathname: `/project/[projectId]/traces`,
  },
  {
    title: "会话",
    icon: Clock,
    productModule: "tracing",
    group: RouteGroup.AgentAndModel,
    section: RouteSection.Main,
    pathname: `/project/[projectId]/sessions`,
  },
  {
    title: "用户",
    pathname: `/project/[projectId]/users`,
    icon: UsersIcon,
    productModule: "tracing",
    group: RouteGroup.AgentAndModel,
    section: RouteSection.Main,
  },
  {
    title: "提示词",
    pathname: "/project/[projectId]/prompts",
    icon: FileJson,
    projectRbacScopes: ["prompts:read"],
    productModule: "prompt-management",
    group: RouteGroup.AgentAndModel,
    section: RouteSection.Main,
  },
  {
    title: "Playground",
    pathname: "/project/[projectId]/playground",
    icon: TerminalIcon,
    productModule: "playground",
    group: RouteGroup.AgentAndModel,
    section: RouteSection.Main,
  },
  {
    title: "模型",
    pathname: "/project/[projectId]/settings/models",
    icon: Cog,
    group: RouteGroup.AgentAndModel,
    section: RouteSection.Main,
  },
  {
    title: "评分",
    pathname: `/project/[projectId]/scores`,
    group: RouteGroup.AgentAndModel,
    section: RouteSection.Main,
    icon: SquarePercent,
  },
  {
    title: "数据集",
    pathname: `/project/[projectId]/datasets`,
    icon: Database,
    productModule: "datasets",
    group: RouteGroup.AgentAndModel,
    section: RouteSection.Main,
  },
  // ── 评测中心 ──
  {
    title: "评测总览",
    pathname: `/project/[projectId]/evalbear-eval`,
    projectRbacScopes: ["evalJob:read"],
    group: RouteGroup.RagAndMemory,
    section: RouteSection.Main,
    icon: ClipboardCheck,
  },
  {
    title: "Agent 评测",
    pathname: `/project/[projectId]/evalbear-eval/agent`,
    projectRbacScopes: ["evalJob:read"],
    group: RouteGroup.RagAndMemory,
    section: RouteSection.Main,
    icon: Beaker,
  },
  {
    title: "记忆评测",
    pathname: `/project/[projectId]/evalbear-eval/memory`,
    projectRbacScopes: ["evalJob:read"],
    group: RouteGroup.RagAndMemory,
    section: RouteSection.Main,
    icon: Brain,
  },
  {
    title: "RAG 评测",
    pathname: `/project/[projectId]/evalbear-eval/rag`,
    projectRbacScopes: ["evalJob:read"],
    group: RouteGroup.RagAndMemory,
    section: RouteSection.Main,
    icon: BookOpen,
  },
  {
    title: "运行历史",
    pathname: `/project/[projectId]/evalbear-eval/history`,
    projectRbacScopes: ["evalJob:read"],
    group: RouteGroup.RagAndMemory,
    section: RouteSection.Main,
    icon: History,
  },
  {
    title: "样本复核",
    pathname: `/project/[projectId]/evalbear-eval/review`,
    projectRbacScopes: ["evalJob:read"],
    group: RouteGroup.RagAndMemory,
    section: RouteSection.Main,
    icon: Eye,
  },
  {
    title: "报告",
    pathname: `/project/[projectId]/evalbear-eval/reports`,
    projectRbacScopes: ["evalJob:read"],
    group: RouteGroup.RagAndMemory,
    section: RouteSection.Main,
    icon: FileText,
  },
  {
    title: "配置",
    pathname: `/project/[projectId]/evalbear-eval/config`,
    projectRbacScopes: ["evalJob:read"],
    group: RouteGroup.RagAndMemory,
    section: RouteSection.Main,
    icon: Cog,
  },
  {
    title: "升级",
    icon: Sparkle,
    pathname: "/project/[projectId]/settings/billing",
    section: RouteSection.Secondary,
    entitlements: ["cloud-billing"],
    organizationRbacScope: "langfuseCloudBilling:CRUD",
    show: ({ organization }) => organization?.plan === "cloud:hobby",
  },
  {
    title: "升级",
    icon: Sparkle,
    pathname: "/organization/[organizationId]/settings/billing",
    section: RouteSection.Secondary,
    entitlements: ["cloud-billing"],
    organizationRbacScope: "langfuseCloudBilling:CRUD",
    show: ({ organization }) => organization?.plan === "cloud:hobby",
  },
  {
    title: "云端状态",
    section: RouteSection.Secondary,
    pathname: "",
    menuNode: <CloudStatusMenu />,
  },
  {
    title: "预览（快通道）",
    pathname: "",
    section: RouteSection.Secondary,
    featureFlag: "v4BetaToggleVisible",
    menuNode: <V4SidebarToggle />,
  },
  {
    title: "设置",
    pathname: "/project/[projectId]/settings",
    icon: Settings,
    section: RouteSection.Secondary,
  },
  {
    title: "设置",
    pathname: "/organization/[organizationId]/settings",
    icon: Settings,
    section: RouteSection.Secondary,
  },
  {
    title: "AI 助手",
    section: RouteSection.Secondary,
    pathname: "",
    featureFlag: "inAppAgent",
    show: ({ organization, projectId, isLangfuseCloud }) =>
      isLangfuseCloud && organization !== undefined && projectId !== undefined,
    menuNode: <InAppAiAgentButton />,
  },
];

function CommandMenuTrigger() {
  const { setOpen } = useCommandMenu();
  const capture = usePostHogClientCapture();

  return (
    <SidebarMenuButton
      onClick={() => {
        capture("cmd_k_menu:opened", {
          source: "main_navigation",
        });
        setOpen(true);
      }}
      className="whitespace-nowrap"
    >
      <Search className="h-4 w-4" />
      跳转到...
      <KeyboardShortcut
        className="ml-auto"
        keys={[navigator.userAgent.includes("Mac") ? "⌘" : "Ctrl", "K"]}
      />
    </SidebarMenuButton>
  );
}
