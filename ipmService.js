const { Client } = require("pg");
const fs = require("fs");
const { execSync } = require("child_process");

const { build1240 } = require("./mapper1240");
const { build1644 } = require("./mapper1644");

function getDateTime() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

async function generateIPM(pan,aliaspan) {
  if (!aliaspan || !pan) {
    throw new Error("alias_pan and pan are required");
  }

  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "ipm_test",
    password: "postgres",
    port: 5432
  });

  await client.connect();

  try {
     // =========================
    // 1. GET TOKEN CARD FROM alias_pan
    // =========================
    const cardRes = await client.query(
      `SELECT card_number
       FROM card
       WHERE alias_pan = $1`,
      [aliaspan]
    );
    if (cardRes.rows.length === 0) {
      throw new Error("No card found for alias_pan");
    }

    const tokenpan = cardRes.rows[0].card_number;

    const res = await client.query(
      `
      SELECT *
      FROM approved_authorization
      WHERE card_number = $1
      `,
      [tokenpan]
    );
    const rows = res.rows;
     if (rows.length === 0) {
      throw new Error("No authorization found for this pan");
    }


    const fileContent = [
      ...build1644(rows, "PRE"),
      ...rows.map(row => build1240(row, pan)),
      ...build1644(rows, "POST")
    ];

    const jsonFile = `approved_authorization_${Date.now()}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(fileContent, null, 2));

    const outputFile = `HPS_MCI_Clearing_File_${getDateTime()}.ipm`;

    execSync(`json2ipm.exe ${jsonFile} -o ${outputFile}`, {
      stdio: "inherit"
    });

    return outputFile;

  } finally {
    await client.end();
  }
}

module.exports = { generateIPM };