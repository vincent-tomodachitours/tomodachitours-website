import fs from 'fs';
import fetch from 'node-fetch';

const CONFIG_URL = "https://script.google.com/macros/s/AKfycbx0SYiaVfJzwFdcLlTEz6-T_zxlhPMOgr3pHwZlm8m5Zsk7KwANi-ApP-msf5ZZTDWv/exec";
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