import { describe, expect, it } from "vitest";

import { buildTopologyViewModel } from "./topology";

describe("buildTopologyViewModel", () => {
  it("maps flow and role relations into nodes and edges", () => {
    const viewModel = buildTopologyViewModel({
      flows: [
        {
          slug: "prd-to-delivery",
          name: "PRD 到交付",
          requiredRoles: ["requirement-analyst", "frontend-implementer", "code-guardian"],
          optionalRoles: ["archive-change"],
        },
      ],
      roles: [
        { slug: "requirement-analyst", name: "需求解析专家", status: "active" },
        { slug: "frontend-implementer", name: "前端实现专家", status: "active" },
        { slug: "code-guardian", name: "规范守护者", status: "active" },
        { slug: "archive-change", name: "归档专家", status: "active" },
      ],
    });

    expect(viewModel.nodes).toHaveLength(5);
    expect(viewModel.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "prd-to-delivery",
          target: "requirement-analyst",
          kind: "required",
        }),
        expect.objectContaining({
          source: "prd-to-delivery",
          target: "archive-change",
          kind: "optional",
        }),
      ]),
    );
  });
});
