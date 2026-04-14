#!/bin/bash
set -e
echo "🚀 修正プログラムを適用中..."
mkdir -p src/lib/providers src/lib/services src/lib/agents src/app/api/chat src/components src/contexts src/hooks
# ... (中略：以前の長いスクリプト内容) ...
chmod +x apply_changes.sh
./apply_changes.sh
