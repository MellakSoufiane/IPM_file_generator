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

async function run() {

  const PAN = process.argv[2];

  if (!PAN) {
    console.log("Usage:");
    console.log("node generate.js <PAN>");
    process.exit(1);
  }


  // ======================
  // DATABASE
  // ======================

  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "ipm_test",
    password: "postgres",
    port: 5432
  });

  await client.connect();

  // ======================
  // LOAD DATA
  // ======================

  const res = await client.query(`
      SELECT *
      FROM approved_authorization
  `);

  const rows = res.rows;

  console.log(`Loaded ${rows.length} rows`);

  // ======================
  // BUILD FILE
  // ======================

  const fileContent = [

    // HEADER
    ...build1644(rows, "PRE"),

    // TRANSACTIONS
    ...rows.map(row => build1240(row, PAN)),

    // FOOTER
    ...build1644(rows, "POST")

  ];

  // ======================
  // WRITE JSON
  // ======================
  const jsonFile = "approved_authorization.json";

  fs.writeFileSync(
    jsonFile,
    JSON.stringify(
      fileContent,
      null,
      2
    ),
    "utf8"
  );

  console.log("✅ JSON generated");

  const datetime = getDateTime();

  const outputFile =
    `HPS_MCI_Clearing_File_${datetime}.ipm`;

  const cmd =
    `json2ipm.exe ${jsonFile} -o ${outputFile}`;

  console.log("Running:", cmd);

  execSync(cmd, {
    stdio: "inherit"
  });

  console.log(`✅ IPM generated : ${outputFile}`);

  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});