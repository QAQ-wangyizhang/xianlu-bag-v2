import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "./globals.css";

export const metadata: Metadata = {
  title: "修仙录 · 多账号工具",
  description: "修仙录多账号背包查看 / 升段缺口计算 / 闭关自动化",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

// 移动端视口适配
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * 莫兰迪水墨色板（修仙/国风 + 现代简洁）
 * 主色 黛青 #5B7B8C · 辅色 竹绿 #6FA287 · 点缀 赭黄 #C9A15F · 警示 陶红 #C47B6D
 * 纸感背景 #F5F6F2 · 墨色正文 #33414A · 描边 #E3E6E0
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ConfigProvider
            locale={zhCN}
            theme={{
              token: {
                colorPrimary: "#5B7B8C",
                colorSuccess: "#6FA287",
                colorWarning: "#C9A15F",
                colorError: "#C47B6D",
                colorInfo: "#6E8CA0",
                colorBgLayout: "#F5F6F2",
                colorBgContainer: "#FFFFFF",
                colorBorder: "#E3E6E0",
                colorBorderSecondary: "#E3E6E0",
                colorText: "#33414A",
                colorTextSecondary: "#6B7A84",
                colorTextTertiary: "#93A0A8",
                borderRadius: 8,
                borderRadiusLG: 12,
                fontSize: 14,
                fontFamily: "'LXGW WenKai', 'Kaiti SC', 'KaiTi', 'STKaiti', 'PingFang SC', 'Microsoft YaHei', serif",
              },
              components: {
                Card: {
                  borderRadiusLG: 14,
                  headerFontSize: 15,
                },
                Tabs: {
                  itemSelectedColor: "#4A6676",
                  inkBarColor: "#5B7B8C",
                  itemHoverColor: "#5B7B8C",
                },
                Button: { borderRadius: 8 },
                Tag: { borderRadiusSM: 6 },
              },
            }}
          >
            <App>{children}</App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
