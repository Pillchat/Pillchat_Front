import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      if (config.env.screenAudit) {
        on("before:browser:launch", (browser, launchOptions) => {
          if (browser.name === "electron") {
            launchOptions.preferences.width = 1800;
            launchOptions.preferences.height = 1600;
          } else if (browser.family === "chromium") {
            launchOptions.args.push("--window-size=1800,1600");
          }
          return launchOptions;
        });
      }
    },
  },
});
