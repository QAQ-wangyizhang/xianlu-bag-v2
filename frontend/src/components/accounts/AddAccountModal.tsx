"use client";

import { useState } from "react";
import { App, Form, Input, Modal } from "antd";
import { apiPost } from "@/lib/api";

export default function AddAccountModal({
  open, onClose, onSuccess,
}: {
  open: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const values = await form.validateFields();
    const { username, password } = values;
    setLoading(true);
    try {
      const r = await apiPost<{ ok: boolean; name?: string; error?: string }>("/api/accounts", { username, password });
      if (r.error) {
        message.error(r.error);
        return;
      }
      message.success("添加成功：" + (r.name || username));
      onSuccess();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="添加账号"
      okText={loading ? "验证中…" : "添加并验证"}
      cancelText="取消"
      confirmLoading={loading}
      onOk={submit}
      onCancel={onClose}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="username"
          label="账号"
          rules={[{ required: true, message: "请输入账号" }]}
        >
          <Input placeholder="输入游戏账号" autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: "请输入密码" }]}
        >
          <Input.Password placeholder="输入密码" autoComplete="new-password" onPressEnter={submit} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
