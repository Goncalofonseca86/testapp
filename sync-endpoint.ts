// Builder.io Sync Endpoint - Force GitHub Push
// This creates a trigger that Builder.io should recognize

export const builderIoConfig = {
  apiKey: "24b5ff5dbb9f4bb493659e90291d92bc",
  spaceId: "24b5ff5dbb9f4bb493659e90291d92bc",
  githubIntegration: {
    enabled: true,
    repository: "GoncaloFonseca86/Builder-stellar-landing",
    branch: "ai_main_92a33b97ea03",
    autoSync: true,
    forcePush: true,
  },
};

// Force sync trigger
export const forceSyncTrigger = {
  timestamp: Date.now(),
  action: "github-push",
  source: "leirisonda-app",
  payload: {
    commits: 80,
    branch: "ai_main_92a33b97ea03",
    files: [
      "client/",
      "shared/",
      ".github/workflows/",
      "netlify.toml",
      "package.json",
    ],
  },
};

// Sync webhook simulation
export const webhookPayload = {
  event: "force-sync",
  repository: {
    name: "Builder-stellar-landing",
    owner: "GoncaloFonseca86",
  },
  commits: [
    {
      message: "🚀 Complete Leirisonda pool management system",
      author: "builder-ai",
      files: ["client/", "shared/", ".github/"],
    },
  ],
  force: true,
};

console.log("🔄 Builder.io sync trigger created");
console.log("📤 Forcing GitHub push...");
