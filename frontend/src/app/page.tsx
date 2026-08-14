"use client";

import { useState, useEffect } from "react";
import { Button, Tabs } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { TabName } from "@/types";
import { useBags } from "@/hooks/useBags";
import { useGameConstants } from "@/hooks/useGameConstants";
import BagTab from "@/components/bags/BagTab";
import GapTab from "@/components/gap/GapTab";
import AccountsTab from "@/components/accounts/AccountsTab";
import OwnersTab from "@/components/owners/OwnersTab";
import SignupTab from "@/components/signup/SignupTab";

const TAB_ICONS: Record<TabName, string> = {
  bags: "/icons/tab-bag.png",
  gap: "/icons/tab-gap.png",
  signup: "/icons/tab-signup.png",
  owners: "/icons/tab-owners.png",
  accounts: "/icons/tab-settings.png",
};

const TABS: { key: TabName; label: string }[] = [
  { key: "bags", label: "背包总览" },
  { key: "gap", label: "升段缺口" },
  { key: "signup", label: "自动报名" },
  { key: "owners", label: "归属人" },
  { key: "accounts", label: "设置" },
];

export default function HomePage() {
  const [tab, setTab] = useState<TabName>("bags");
  const { constants } = useGameConstants();
  const bagCtrl = useBags();

  // 启动：读取 hash 定位 tab
  useEffect(() => {
    bagCtrl.loadAccounts().then((accs) => {
      if (accs.length) {
        bagCtrl.loadAll();
        const hash = location.hash.replace("#", "");
        if (TABS.some((t) => t.key === hash)) {
          setTab(hash as TabName);
        }
      } else {
        setTab("accounts");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // hash 路由：切换 tab 写 hash；浏览器前进/后退/手动改 hash 同步
  useEffect(() => {
    const onHash = () => {
      const h = location.hash.replace("#", "");
      if (TABS.some((t) => t.key === h)) setTab(h as TabName);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const switchTab = (key: string) => {
    setTab(key as TabName);
    location.hash = key;
  };

  const items = TABS.map((t) => ({
    key: t.key,
    label: (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <img src={TAB_ICONS[t.key]} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
        {t.label}
      </span>
    ),
    children: (
      <>
        {t.key === "bags" && <BagTab bags={bagCtrl.bags} accounts={bagCtrl.accounts} owners={bagCtrl.owners} constants={constants} loading={bagCtrl.loading} />}
        {t.key === "gap" && (
          <GapTab bags={bagCtrl.bags} accounts={bagCtrl.accounts} owners={bagCtrl.owners} constants={constants} loadAll={bagCtrl.loadAll} loading={bagCtrl.loading} />
        )}
        {t.key === "signup" && (
          <SignupTab accounts={bagCtrl.accounts} owners={bagCtrl.owners} />
        )}
        {t.key === "owners" && (
          <OwnersTab accounts={bagCtrl.accounts} owners={bagCtrl.owners} bags={bagCtrl.bags} constants={constants} loadBagsFor={bagCtrl.loadBagsFor} />
        )}
        {t.key === "accounts" && <AccountsTab accounts={bagCtrl.accounts} owners={bagCtrl.owners} onChanged={bagCtrl.loadAccounts} />}
      </>
    ),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Header（吸顶） */}
      <header
        className="app-header"
        style={{
          height: 56,
          background: "#fff",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <h1 className="serif-title" style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          修仙录 · 多账号工具
        </h1>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={bagCtrl.loading}
          onClick={() => bagCtrl.loadAll()}
        >
          全部刷新
        </Button>
      </header>

      {/* 主内容（1400 居中，移动端自适应） */}
      <main className="app-main">
        <Tabs
          className="main-tabs"
          activeKey={tab}
          onChange={switchTab}
          items={items}
          size="large"
          style={{ marginTop: 8 }}
        />
      </main>
    </div>
  );
}
