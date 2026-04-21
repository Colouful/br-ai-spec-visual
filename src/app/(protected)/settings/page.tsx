import { ConsolePage } from "@/components/dashboard/console-page";
import { SettingsSkeleton } from "@/components/settings/settings-skeleton";
import { getSettingsPageVm } from "@/lib/view-models/settings";

export default async function SettingsPage() {
  const viewModel = await getSettingsPageVm();

  return (
    <ConsolePage hero={viewModel.hero}>
      <SettingsSkeleton viewModel={viewModel} />
    </ConsolePage>
  );
}
