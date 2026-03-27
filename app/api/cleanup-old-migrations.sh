#!/bin/bash

# Migration Cleanup Script
# Run this after confirming new migrations work correctly

echo "🧹 Cleaning up old ORM-based migration files..."

# Delete old ORM migrations (keep v2 versions)
rm -f src/db/migrations/20260201-0002-extend-goal-progress.ts
rm -f src/db/migrations/20260201-0003-create-extraction-corrections.ts
rm -f src/db/migrations/20260201-0004-create-progress-entries.ts
rm -f src/db/migrations/20260201-0005-create-services-and-logs.ts
rm -f src/db/migrations/20260201-0006-create-dashboard-views.ts

echo "✅ Deleted 5 old migration files"
echo ""
echo "📋 Remaining migrations:"
ls -1 src/db/migrations/20260201-*.ts

echo ""
echo "💡 Now rename -v2 files to remove the v2 suffix:"
echo "   mv src/db/migrations/20260201-0002-extend-goal-progress-v2.ts src/db/migrations/20260201-0002-extend-goal-progress.ts"
echo "   mv src/db/migrations/20260201-0003-create-extraction-corrections-v2.ts src/db/migrations/20260201-0003-create-extraction-corrections.ts"
echo "   mv src/db/migrations/20260201-0004-create-progress-entries-v2.ts src/db/migrations/20260201-0004-create-progress-entries.ts"
echo "   mv src/db/migrations/20260201-0005-create-services-and-logs-v2.ts src/db/migrations/20260201-0005-create-services-and-logs.ts"
echo "   mv src/db/migrations/20260201-0006-create-dashboard-views-v2.ts src/db/migrations/20260201-0006-create-dashboard-views.ts"
