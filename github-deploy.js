#!/usr/bin/env node

// Direct GitHub API deployment for Leirisonda
const https = require("https");
const fs = require("fs");

const deployData = {
  ref: "ai_main_92a33b97ea03",
  inputs: {
    deploy_type: "leirisonda-app",
    force_deploy: "true",
    timestamp: new Date().toISOString(),
  },
};

// GitHub API endpoints to try
const endpoints = [
  "/repos/GoncaloFonseca86/Builder-stellar-landing/dispatches",
  "/repos/GoncaloFonseca86/Builder-stellar-landing/actions/workflows/deploy.yml/dispatches",
  "/repos/GoncaloFonseca86/Builder-stellar-landing/actions/workflows/sync-builderio.yml/dispatches",
];

async function triggerDeploy() {
  console.log("🚀 Attempting GitHub API deployment...");

  for (const endpoint of endpoints) {
    try {
      const options = {
        hostname: "api.github.com",
        path: endpoint,
        method: "POST",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Leirisonda-Deploy/1.0",
        },
      };

      const req = https.request(options, (res) => {
        console.log(`Status: ${res.statusCode} for ${endpoint}`);

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode === 200 || res.statusCode === 204) {
            console.log("✅ Deploy triggered successfully!");
          } else {
            console.log("Response:", data);
          }
        });
      });

      req.on("error", (error) => {
        console.log(`❌ Error for ${endpoint}:`, error.message);
      });

      req.write(
        JSON.stringify({
          event_type: "leirisonda-deploy",
          client_payload: deployData,
        }),
      );
      req.end();
    } catch (error) {
      console.log(`❌ Failed ${endpoint}:`, error.message);
    }
  }
}

// Create deployment manifest
const manifest = {
  app: "leirisonda",
  version: "1.0.0",
  commits: 85,
  status: "ready",
  features: [
    "Complete pool management system",
    "Photo upload and gallery",
    "Professional PDF reports",
    "Auto-sync data system",
    "Leirisonda branding",
  ],
  deploy_url: "pending",
};

fs.writeFileSync("deployment-manifest.json", JSON.stringify(manifest, null, 2));
console.log("📄 Deployment manifest created");

triggerDeploy();
