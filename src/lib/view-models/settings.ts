import { getDemoConsoleData } from "@/lib/demo/console-data";
import type { PageHeroVm } from "@/lib/view-models/types";

export interface SettingItemVm {
  id: string;
  label: string;
  value: string;
  description: string;
  mode: string;
}

export interface SettingsPageVm {
  hero: PageHeroVm;
  sections: Array<{
    id: string;
    title: string;
    summary: string;
    items: SettingItemVm[];
  }>;
}

export async function getSettingsPageVm(): Promise<SettingsPageVm> {
  const data = await getDemoConsoleData();

  return {
    hero: {
      eyebrow: "系统设置",
      title: "可承载真实控制项的策略骨架",
      subtitle:
        "先把运行窗口、审批策略和保留规则做成稳定骨架，后续接真实开关或表单时不需要推翻页面结构。",
      stats: [
        {
          label: "分区数",
          value: String(data.settings.length),
        },
        {
          label: "策略数",
          value: String(data.settings.reduce((sum, section) => sum + section.items.length, 0)),
        },
        {
          label: "模式",
          value: "托管 / 混合 / 草稿",
        },
      ],
    },
    sections: data.settings.map((section) => ({
      id: section.id,
      title: section.title,
      summary: section.summary,
      items: section.items.map((item) => ({
        id: item.id,
        label: item.label,
        value: item.value,
        description: item.description,
        mode: item.mode,
      })),
    })),
  };
}
