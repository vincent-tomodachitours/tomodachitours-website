import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CONFIG_URL = process.env.APPS_SCRIPT_CONFIG_URL;
if (!CONFIG_URL) {
    console.error("Error: APPS_SCRIPT_CONFIG_URL environment variable is not set");
    process.exit(1);
}

const OUTPUT_PATH = "./src/config.json";

async function fetchConfig() {
    try {
        console.log("Fetching config from Google Sheets...");

        const response = await fetch(CONFIG_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const configData = await response.json();
        console.log("Config fetched successfully:", configData);

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(configData, null, 2));
        console.log(`Config written to ${OUTPUT_PATH}`);
    } catch (error) {
        console.error("Error fetching config:", error);
        process.exit(1);
    }
}

fetchConfig();