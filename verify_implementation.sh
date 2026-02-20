#!/bin/bash
# Verification script for System Logs Database Implementation

echo "=== System Logs Database Implementation Verification ==="
echo ""

# Check backend files
echo "Backend Files:"
ls -lh backend/migrations/010_create_system_logs.sql 2>/dev/null && echo "✓ Database migration" || echo "✗ Database migration missing"
ls -lh backend/src/services/systemLogService.ts 2>/dev/null && echo "✓ Backend service" || echo "✗ Backend service missing"
ls -lh backend/src/routes/systemLogs.ts 2>/dev/null && echo "✓ Backend routes" || echo "✗ Backend routes missing"

echo ""
echo "Frontend Files:"
ls -lh frontend/src/services/systemLogService.ts 2>/dev/null && echo "✓ Frontend service" || echo "✗ Frontend service missing"
ls -lh frontend/src/pages/SystemLogsPage.tsx 2>/dev/null && echo "✓ SystemLogsPage component" || echo "✗ SystemLogsPage missing"

echo ""
echo "Configuration Files:"
grep -q "systemLogsRoutes" backend/src/app.ts && echo "✓ Backend routes registered" || echo "✗ Backend routes not registered"
grep -q "SystemLogsPage" frontend/src/App.tsx && echo "✓ Frontend route configured" || echo "✗ Frontend route not configured"
grep -q "system-logs" frontend/src/components/Layout/Sidebar.tsx && echo "✓ Navigation menu updated" || echo "✗ Navigation menu not updated"

echo ""
echo "=== Implementation Complete ==="
echo ""
echo "Next steps:"
echo "1. Run database migration: npm run db:migrate"
echo "2. Start backend server"
echo "3. Start frontend dev server"
echo "4. Visit http://localhost:5173/system-logs to view system logs"
echo "5. Use browser dev console to test log persistence"
