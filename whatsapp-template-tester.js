// WhatsApp Template Tester Script
// Prompts for phone number, lets you select a template, and sends a WhatsApp template message

const https = require("https");
const readline = require("readline");

// --- CONFIGURATION ---
const config = {
  token:
    "EAAKOORucVewBPECu0TeSoVPRSeBLi8AiemsxjQZBtiza6obXnBGHOa2AbvKobldGQ1YZBy8HY5hrJTZAPCevYjLafQsZCME1muc2wMl49MDQfmBrQPeGuD8V0oZC40WfvDWRtMLbFB4ydbVbeI34qqFkXHBWD434qSZCSNpMGvDUMU601p8LAgSyZAiFOVMMYgogM7HeVg6Mk8VVZCRP4QMR0D2ZCwSad7LOVDZCkqmritLvt64QZDZD",
  phoneNumberId: "703783789484730",
  businessAccountId: "1457638025256952",
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function fetchTemplates() {
  return new Promise((resolve) => {
    const options = {
      hostname: "graph.facebook.com",
      path: `/v17.0/${config.businessAccountId}/message_templates?access_token=${config.token}`,
      method: "GET",
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          if (response.data) {
            resolve(
              response.data.filter(
                (t) => t.status === "APPROVED" || t.status === "ACTIVE"
              )
            );
          } else {
            console.log(
              "❌ Could not fetch templates:",
              response.error?.message || data
            );
            resolve([]);
          }
        } catch (e) {
          console.log("❌ Parse error:", e.message);
          resolve([]);
        }
      });
    });
    req.on("error", (error) => {
      console.log("❌ Request error:", error.message);
      resolve([]);
    });
    req.end();
  });
}

async function main() {
  console.log("📱 WhatsApp Template Tester");
  console.log("--------------------------\n");
  console.log(
    "This script will send a WhatsApp template message to a phone number of your choice."
  );
  console.log(
    "You can only send messages using templates that are approved and available in your WhatsApp Business account."
  );
  console.log("");

  // 1. Get phone number
  let phoneNumber = await ask(
    "Enter phone number (with country code, e.g. 919876543210): "
  );
  phoneNumber = phoneNumber.replace(/\D/g, "");
  if (!phoneNumber || phoneNumber.length < 10) {
    console.log("❌ Invalid phone number. Exiting.");
    rl.close();
    return;
  }

  // 2. Fetch templates
  console.log("\nFetching available templates...");
  const templates = await fetchTemplates();
  if (!templates.length) {
    console.log("❌ No approved templates found. Exiting.");
    rl.close();
    return;
  }
  console.log(`\nAvailable templates:`);
  templates.forEach((t, i) => {
    console.log(`  [${i + 1}] ${t.name} (${t.language})`);
  });

  // 3. Select template
  let templateIdx = await ask(`\nSelect a template [1-${templates.length}]: `);
  templateIdx = parseInt(templateIdx, 10) - 1;
  if (
    isNaN(templateIdx) ||
    templateIdx < 0 ||
    templateIdx >= templates.length
  ) {
    console.log("❌ Invalid selection. Exiting.");
    rl.close();
    return;
  }
  const template = templates[templateIdx];

  // 4. Gather parameters
  let params = [];
  if (template.components) {
    const body = template.components.find((c) => c.type === "BODY");
    if (body && body.text) {
      // Count {{n}} placeholders
      const matches = body.text.match(/{{\d+}}/g);
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          const val = await ask(`Enter value for ${matches[i]}: `);
          params.push({ type: "text", text: val });
        }
      }
    }
  }

  // 5. Send template message
  const payload = JSON.stringify({
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "template",
    template: {
      name: template.name,
      language: { code: template.language },
      components: params.length
        ? [{ type: "body", parameters: params }]
        : undefined,
    },
  });

  const options = {
    hostname: "graph.facebook.com",
    path: `/v17.0/${config.phoneNumberId}/messages`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
  };

  console.log("\nSending message...");
  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const response = JSON.parse(data);
        if (response.error) {
          console.log("❌ WhatsApp API Error:", response.error.message);
        } else {
          console.log("✅ Message sent successfully!");
          console.log("   Message ID:", response.messages?.[0]?.id);
        }
      } catch (e) {
        console.log("❌ Parse error:", e.message);
        console.log("Raw response:", data);
      }
      rl.close();
    });
  });
  req.on("error", (error) => {
    console.log("❌ Request error:", error.message);
    rl.close();
  });
  req.write(payload);
  req.end();
}

main();
