import React from "react";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";

export interface DocumentWorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentWorkspacePage({
  params,
}: DocumentWorkspacePageProps) {
  const resolvedParams = await params;
  return <RedliningStudioWorkspace documentId={resolvedParams.id} />;
}

