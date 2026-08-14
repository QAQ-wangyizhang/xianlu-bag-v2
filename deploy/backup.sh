#!/usr/bin/env bash
# ============================================================
# 修仙录 · 多账号工具 —— 数据备份脚本（data/ 含账号密码，务必定期备份）
# 用法: sudo bash backup.sh          # 手动备份
# 定时: crontab -e 加一行每天凌晨备份
#       0 3 * * * /opt/xianlu-bag-v2/deploy/backup.sh >> /var/log/xianlu-backup.log 2>&1
# ============================================================
set -euo pipefail

APP_DIR=/opt/xianlu-bag-v2-live
BACKUP_DIR=/backup
KEEP=14  # 保留最近 14 份

mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/xianlu-$(date +%F_%H%M).tgz"
tar czf "$FILE" -C "$APP_DIR" data
chmod 600 "$FILE"

# 清理旧备份
ls -t "$BACKUP_DIR"/xianlu-*.tgz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "备份完成: $FILE"
