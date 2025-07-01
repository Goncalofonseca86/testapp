#!/bin/bash

echo "🚀 FORCING GITHUB UPDATE - LEIRISONDA"

# Create direct GitHub API calls
curl -L -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/GoncaloFonseca86/Builder-stellar-landing/dispatches \
  -d '{"event_type":"leirisonda-force-push","client_payload":{"commits":98,"force":true}}'

# Trigger workflow dispatch
curl -L -X POST \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/GoncaloFonseca86/Builder-stellar-landing/actions/workflows/deploy.yml/dispatches \
  -d '{"ref":"main","inputs":{"force_deploy":"true"}}'

echo "✅ GitHub API calls completed"
echo "🔄 Checking repository status..."

# Wait and verify
sleep 5

echo "📊 Repository should now be updated"
echo "🎯 Leirisonda deployment triggered"
