"use client";

/** 折叠容器：grid-template-rows 0fr→1fr 高度过渡动画（展开/收起 220ms ease-out） */
export default function CollapseBox({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: open ? "1fr" : "0fr",
        transition: "grid-template-rows 220ms ease-out",
      }}
    >
      <div style={{ overflow: "hidden", minHeight: 0 }}>{children}</div>
    </div>
  );
}
