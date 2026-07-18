/**
 * Unauthenticated layout variant
 * Used for sign-in, sign-up, and other auth pages
 * Wraps children in the EvalBear auth shell.
 */

import type { PropsWithChildren } from "react";
import { SidebarProvider } from "@/src/components/ui/sidebar";
import { EvalBearAuthLayout } from "@/src/components/evalbear/EvalBearAuthLayout";

export function UnauthenticatedLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider className="bg-background">
      <EvalBearAuthLayout>{children}</EvalBearAuthLayout>
    </SidebarProvider>
  );
}
