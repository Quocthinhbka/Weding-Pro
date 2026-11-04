#!/bin/sh
# Sao lưu cơ sở dữ liệu và video lời chúc. Chạy trên VPS, trong thư mục dự án:
#   sh scripts/backup.sh [thư-mục-lưu]   (mặc định ./backups)
set -e

BACKUP_DIR=${1:-./backups}
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

# VACUUM INTO tạo bản sao nhất quán ngay cả khi trang đang có người dùng.
docker compose exec -T app node -e "
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
fs.rmSync('/data/backup.db', { force: true });
new DatabaseSync('/data/wedding.db').exec(\"VACUUM INTO '/data/backup.db'\");
"
docker compose cp app:/data/backup.db "$BACKUP_DIR/wedding-$STAMP.db"
docker compose exec -T app rm -f /data/backup.db

docker compose exec -T app sh -c 'cd /data && if [ -d uploads ]; then tar -czf - uploads; fi' > "$BACKUP_DIR/uploads-$STAMP.tar.gz"

echo "Đã sao lưu:"
ls -lh "$BACKUP_DIR/wedding-$STAMP.db" "$BACKUP_DIR/uploads-$STAMP.tar.gz"
