import Link from "next/link";

interface WorkspacePipelineHintsProps {
  workspaceSlug: string;
}

/**
 * 工作区设置中的运维说明：流水线会隐藏陈旧运行记录与终态/库清理策略，与生产功能解耦说明。
 */
export function WorkspacePipelineHints({ workspaceSlug }: WorkspacePipelineHintsProps) {
  const w = encodeURIComponent(workspaceSlug);
  return (
    <div className="glass-panel space-y-4 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-slate-200">数据与看板</h2>
      <ul className="space-y-2 text-sm leading-6 text-slate-400">
        <li>
          <strong className="font-medium text-slate-300">流水线的「运行」列</strong>
          来自 <span className="font-mono">RunState</span> 同步，与
          <span className="font-mono"> ChangeDocument</span> 的规范/需求不是同一张表。
        </li>
        <li>
          无终态且超过阈值的运行在流水线中<strong>默认不展示</strong>（不删库）。全部运行记录见{" "}
          <Link
            className="text-cyan-300/90 underline decoration-cyan-500/40 underline-offset-2 hover:decoration-cyan-300/60"
            href={`/w/${w}/runs`}
          >
            运行
          </Link>
          。环境变量
          <span className="font-mono"> PIPELINE_STALE_RUN_MAX_AGE_HOURS</span> 控制「陈旧」判定时长，默认
          24 小时。
        </li>
        <li>
          源头上应在 br-ai-spec 一次运行结束或退出时推{" "}
          <span className="font-mono">run.state_changed</span>（完成态）或
          <span className="font-mono"> run.archived</span>，使本控制台收到终态事件。详见
          文档《最小验证-真实需求开发到 visual》3.0.1 节。
        </li>
      </ul>
      <p className="text-[11px] font-mono text-slate-500">
        开发环境清理（慎用）：按 workspace 删除运行投影 ——
        <br />
        {`DELETE FROM RunEvent WHERE workspaceId='...';`}{" "}
        <br />
        {`DELETE FROM RunState WHERE workspaceId='...';`}
      </p>
    </div>
  );
}
