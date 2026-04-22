import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceBoard } from "@/components/workspaces/workspace-board";
import type {
  BoardLaneId,
  BoardLaneVm,
  WorkspaceBoardVm,
} from "@/lib/view-models/board";

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

describe("WorkspaceBoard", () => {
  it("keeps horizontal lane overflow on the board list container", () => {
    render(<WorkspaceBoard workspaceId="workspace-test" board={makeBoard()} />);

    const helpPanel = screen.getByText("展开说明").closest("details");
    const laneScroller = helpPanel?.nextElementSibling;

    expect(laneScroller).toHaveClass("overflow-x-auto");
    expect(laneScroller).toHaveClass("overflow-y-hidden");
  });
});
