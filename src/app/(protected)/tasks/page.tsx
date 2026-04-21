import { ConsolePage } from "@/components/dashboard/console-page";
import { RealtimeWorkspaceBridge } from "@/components/realtime/realtime-workspace-bridge";
import { TasksManagement } from "@/components/tasks/tasks-management";
import { getTasksPageVm } from "@/lib/view-models/tasks";

export default async function TasksPage() {
  const viewModel = await getTasksPageVm();

  return (
    <ConsolePage
      hero={viewModel.hero}
      actions={<RealtimeWorkspaceBridge label="任务订阅" workspaceIds={Array.from(new Set(viewModel.rows.map((row) => row.workspaceId)))} />}
    >
      <TasksManagement viewModel={viewModel} />
    </ConsolePage>
  );
}
