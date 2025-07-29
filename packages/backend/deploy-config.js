// Cloudflare Workers deployment configuration for GitHub integration
// This file is used by Cloudflare's GitHub integration to configure the build

module.exports = {
  name: "claude-relay-backend",
  main: "src/index.ts",
  compatibility_date: "2025-07-25",
  
  // Build configuration
  build: {
    command: "npm install && npm run build",
    cwd: "/packages/backend",
    watch_paths: ["src/**/*.ts"]
  },

  // Environment variables should be set in Cloudflare Dashboard:
  // - NODE_ENV
  // - FRONTEND_URL
  // - ADMIN_USERNAME
  // - ADMIN_PASSWORD
  
  // KV Namespace bindings should be configured in Cloudflare Dashboard:
  // - CLAUDE_RELAY_ADMIN_KV
  
  // Cron triggers
  triggers: {
    crons: ["0 */6 * * *"]
  }
};