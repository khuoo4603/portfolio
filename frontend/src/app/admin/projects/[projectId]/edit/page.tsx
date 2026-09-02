import ProjectEditorScreen from "@/features/admin/project-editor-screen";

type AdminProjectEditorPageProps = {
  params: Promise<{ projectId: string }>;
};

// ID 기반 Project Preview-first Editor Page
export default async function AdminProjectEditorPage({ params }: AdminProjectEditorPageProps) {
  const { projectId } = await params;
  return <ProjectEditorScreen projectId={Number(projectId)} />;
}
