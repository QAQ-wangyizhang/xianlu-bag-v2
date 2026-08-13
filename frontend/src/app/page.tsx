"use client";

import { useState, useEffect } from "react";
import { Layout, Tabs, Button, Space, Spin } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { TabName } from "@/types";
import { useBags } from "@/hooks/useBags";
import { useGameConstants } from "@/hooks/useGameConstants";
import BagTab from "@/components/bags/BagTab";
import GapTab from "@/components/gap/GapTab";
import SeclusionTab from "@/components/seclusion/SeclusionTab";
import AccountsTab from "@/components/accounts/AccountsTab";
import OwnersTab from "@/components/owners/OwnersTab";

const { Header } = Layout;

const TABS: { key: TabName; label: string }[] = [
  { key: "bags", label: "背包总览" },
  { key: "gap", label: "升段缺口" },
  { key: "seclusion", label: "闭关修炼" },
  { key: "owners", label: "归属人" },
  { key: "accounts", label: "账号管理" },
];

export default function HomePage() {
  const [tab, setTab] = useState<TabName>("bags");
  const { constants } = useGameConstants();
  const bagCtrl = useBags();
  const [seclAuto, setSeclAuto] = useState(false);

  // 启动
  useEffect(() => {
    bagCtrl.loadAccounts().then((accs) => {
      if (accs.length) {
        bagCtrl.loadAll();
        const hash = location.hash.replace("#", "");
        if (["bags", "gap", "seclusion", "owners", "accounts"].includes(hash)) {
          setTab(hash as TabName);
        }
      } else {
        setTab("accounts");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = TABS.map((t) => ({
    key: t.key,
    label: t.label,
    children: (
      <>
        {t.key === "bags" && <BagTab bags={bagCtrl.bags} accounts={bagCtrl.accounts} constants={constants} />}
        {t.key === "gap" && (
          <GapTab bags={bagCtrl.bags} constants={constants} loadAll={bagCtrl.loadAll} loading={bagCtrl.loading} />
        )}
        {t.key === "seclusion" && (
          <SeclusionTab accounts={bagCtrl.accounts} constants={constants} autoRefresh={seclAuto} setAutoRefresh={setSeclAuto} />
        )}
        {t.key === "owners" && (
          <OwnersTab accounts={bagCtrl.accounts} owners={bagCtrl.owners} bags={bagCtrl.bags} constants={constants} />
        )}
        {t.key === "accounts" && <AccountsTab accounts={bagCtrl.accounts} owners={bagCtrl.owners} onChanged={bagCtrl.loadAccounts} />}
      </>
    ),
  }));

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          paddingInline: 24,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700 }}>修仙录 · 多账号工具</span>
        <span style={{ flex: 1 }} />
        {bagCtrl.loadHint && (
          <Space size={6}>
            <Spin size="small" />
            <span style={{ color: "#999" }}>{bagCtrl.loadHint}</span>
          </Space>
        )}
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={bagCtrl.loading}
          onClick={() => bagCtrl.loadAll()}
        >
          全部刷新
        </Button>
      </Header>

      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as TabName)}
        items={items}
        style={{ paddingInline: 24 }}
      />
    </Layout>
  );
}
