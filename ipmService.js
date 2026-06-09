require("dotenv").config();

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

async function generateIPM(pan, aliaspan) {
  if (!aliaspan || !pan) {
    throw new Error("alias_pan and pan are required");
  }

  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  });

  await client.connect();

  try {
    // =========================
    // 1. GET TOKEN PAN
    // =========================
    const cardRes = await client.query(
      `SELECT card_number FROM card WHERE alias_pan = $1`,
      [aliaspan]
    );

    if (cardRes.rows.length === 0) {
      throw new Error("No card found for alias_pan");
    }

    const tokenpan = cardRes.rows[0].card_number;

    // =========================
    // 2. GET AUTHORIZATIONS
    // =========================
    const res = await client.query(
      `SELECT * FROM approved_authorization WHERE card_number = $1`,
      [tokenpan]
    );

    const rows = res.rows;

    if (!rows.length) {
      throw new Error("No authorization found for this pan");
    }

    // =========================
    // 3. BUILD JSON (IPM LOGICAL)
    // =========================
    const fileContent = [
      ...build1644(rows, "PRE"),
      ...rows.map(row => build1240(row, pan)),
      ...build1644(rows, "POST")
    ];

    const jsonFile = `approved_authorization_${Date.now()}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(fileContent, null, 2));

    // =========================
    // 4. STEP 1 - JSON → IPM
    // =========================
    const baseFile = `step1_${Date.now()}.ipm`;

    execSync(
      `json2ipm.exe ${jsonFile} -o ${baseFile}`,
      { stdio: "inherit" }
    );

    // =========================
    // 5. STEP 2 - IPM → RDW + EBCDIC (CRITICAL FIX)
    // =========================
    const finalFile = `HPS_MCI_Clearing_File_${getDateTime()}.ipm`;

    execSync(
      `ipmconv.exe ${baseFile} -l RDW -f EBCDIC -o ${finalFile}`,
      { stdio: "inherit" }
    );

    // =========================
    // 6. CLEAN TEMP FILE
    // =========================
    fs.unlinkSync(jsonFile);
    fs.unlinkSync(baseFile);

    return finalFile;

  } finally {
    await client.end();
  }
}

module.exports = { generateIPM };