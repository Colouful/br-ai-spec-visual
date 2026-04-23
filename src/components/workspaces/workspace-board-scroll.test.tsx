import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceBoard } from "@/components/workspaces/workspace-board";
import type {
  BoardLaneId,
  BoardLaneVm,
  WorkspaceBoardVm,
} from "@/lib/view-models/board";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

const laneIds: BoardLaneId[] = [
  "backlog",
  "proposal",
  "implementation",
  "guardian",
  "archive",
];

function makeBoard(): WorkspaceBoardVm {
  const lanes: BoardLaneVm[] = laneIds.map((id) => ({
    id,
    title: `lane-${id}`,
    description: `${id} description`,
    accent: "from-slate-400/30 to-slate-700/30",
    cards: [],
  }));

  return {
    workspaceId: "workspace-test",
    lanes,
    totalActive: 0,
    totalArchived: 0,
    pendingGates: 0,
  };
}

describe("WorkspaceBoard scroll behavior", () => {
  it("keeps horizontal lane overflow without trapping page-level vertical scrolling", () => {
    render(<WorkspaceBoard workspaceId="workspace-test" board={makeBoard()} />);

    const helpPanel = screen.getByText("展开说明").closest("details");
    const laneScroller = helpPanel?.nextElementSibling;
    const laneBody = laneScroller?.querySelector("div.overflow-y-auto");

    expect(laneScroller).toHaveClass("overflow-x-auto");
    expect(laneScroller).not.toHaveClass("overflow-y-hidden");
    expect(laneScroller).not.toHaveClass("overscroll-y-none");
    expect(laneBody).toHaveClass("overflow-y-auto");
    expect(laneBody).not.toHaveClass("overscroll-y-contain");
  });
});
