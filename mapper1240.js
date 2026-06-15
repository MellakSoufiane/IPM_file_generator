function pad(val, len) {
  return (val ?? "").toString().padEnd(len, " ");
}

function fixed(val, len) {
  return (val ?? "")
    .toString()
    .substring(0, len)   // IMPORTANT (truncate)
    .padEnd(len, " ");   // THEN pad
}

function formatDateToYYMMDD(date) {
  if (!date) return "000000";

  const d = new Date(date);

  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return yy + mm + dd;
}

function formatDateToYYMM(date) {
  if (!date) return "000000";

  const d = new Date(date);

  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");

  return yy + mm;
}

function formatTime(date) {
  if (!date) return "000000";

  const d = new Date(date);

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return hh + mm + ss;
}

function split3(val) {
  const v = (val || "000000").toString().padEnd(6, "0");
  return {
    s1: v.slice(0, 2),
    s2: v.slice(2, 4),
    s3: v.slice(4, 6),
  };
}

function formatAmount(val) {
  if (val === null || val === undefined) return "000000000000";

  const num = Number(val);

  // convert to minor units (cents logic)
  const converted = Math.round(num * 100);

  return String(converted).padStart(12, "0");
}

let acquirerSequenceNumber = 23958022189;

function generateDE31() {
  const now = new Date();

  // s3 = YDDD (last digit of year + Julian day)
  const yearDigit = String(now.getFullYear()).slice(-1);

  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = String(
    Math.floor((now - startOfYear) / 86400000)
  ).padStart(3, "0");

  const s3 = yearDigit + dayOfYear;

  // s4 = incrementing acquirer sequence number
  const s4 = String(acquirerSequenceNumber++);
  
  // s5 = random check digit
  const s5 = String(Math.floor(Math.random() * 10));

  return {
    s1: "0",
    s2: "230120",
    s3,
    s4,
    s5,
  };
}

function clean(val) {
  return (val ?? "")
    .toString()
    .trim();
}

function buildDE43(cardAccNameAddress) {
  const parts = clean(cardAccNameAddress).split(/\s{2,}/);

  const merchant = parts[0] || "Merchant name         ";
  const city = parts[1] || "Merchant cit";
  const country = parts[2] || "AUS";

  return {
    s1: "Merchant name         ",
    s2: "1234 Main Street",
    s3: "Merchant city",
    s4: "573972    ", // 10 spaces EXACT
    s5: "   ",        // 3 spaces EXACT
    s6: "AUS"
  };
}

function build1240(row, inputPan) {
  return {
    mti: "1240",

    // ======================
    // PRIMARY PAN (FIXED)
    // ======================
    de2: inputPan || "5367635001039824",

    // ======================
    // PROCESSING CODE
    // ======================
    de3: split3(row.processing_code),

    de4: formatAmount(row.transaction_amount),
    de5: formatAmount(row.replacement_amount),
    de6: formatAmount(row.billing_amount),

    de9: String( "75777333"),
    de10: String( "61000000"),

    // ======================
    // DATE/TIME (STRICT)
    // ======================
    de12: {
      s1: formatDateToYYMMDD(row.transaction_local_date),
      s2: formatTime(row.transaction_local_date),
    },

    de14: formatDateToYYMM(row.end_expiry_date),

    // ======================
    // POS ENTRY MODE (STRICT 12 CHARS)
    // ======================
    de22: {
      s1: (row.pos_data || "000000000000").slice(0, 1),
      s2: (row.pos_data || "000000000000").slice(1, 2),
      s3: (row.pos_data || "000000000000").slice(2, 3),
      s4: (row.pos_data || "000000000000").slice(3, 4),
      s5: (row.pos_data || "000000000000").slice(4, 5),
      s6: (row.pos_data || "000000000000").slice(5, 6),
      s7: (row.pos_data || "000000000000").slice(6, 7),
      s8: (row.pos_data || "000000000000").slice(7, 8),
      s9: (row.pos_data || "000000000000").slice(8, 9),
      s10: (row.pos_data || "000000000000").slice(9, 10),
      s11: (row.pos_data || "000000000000").slice(10, 11),
      s12: (row.pos_data || "000000000000").slice(11, 12),
    },

    // ======================
    // FIXED ISO FIELDS
    // ======================
    de23:  "001",
    de24: "200",
    de25: "1401",
    de26: row.card_acceptor_activity || "5542",

    // ======================
    // DE30 (MANDATORY)
    // ======================
    de30: {
      s1: "000000010000",
      s2: "000000000000",
    },

    // ======================
    // DE31 (IMPORTANT FIX)
    // ======================
    de31: generateDE31(row),

    de32: row.acquirer_institution_code || "002108",
    de33: row.acquirer_institution_code || "002108",

    de37: row.reference_number || "000000000000",
    de38: row.authorization_code || "030160",
    de40: "100",

    de41: row.card_acceptor_term_id || "03350022",
    de42: pad(row.card_acceptor_id, 15),

    // DE43 (FIXED 6 PARTS FROM DB)
    // ======================
    de43: buildDE43(row.card_acc_name_address),
    de49: row.transaction_currency || "036",
    de50: "036",
    de51: "036",

    // ======================
    // DE54
    // ======================
    de54: [
      {
        s1: "00",
        s2: "40",
        s3: "840",
        s4: "D",
        s5: "000000010000",
      },
    ],

    // ======================
    // DE55 (FULL STRUCTURE FIXED)
    // ======================
    de55: {
      tag82:  "5C00",
      tag84: "A0000000041010",
      tag95: "0000000000",
      tag9A: formatDateToYYMMDD(row.transaction_local_date),
      tag9C: "00",
      tag5F2A: "0036",
      tag5F34: "00",
      tag9F02: row.chip_transaction_amount || "000000001100",
      tag9F03: "000000000000",
      tag9F10: row.chip_issuer_application_data || "0110250000044000DAC10000000000000000",
      tag9F1A: "0840",
      tag9F1E: "3132333435363738",
      tag9F26: row.chip_application_cryptogram || "C7489033388962B5",
      tag9F27: "80",
      tag9F33: "FFFFFF",
      tag9F34: "000000",
      tag9F35: "00",
      tag9F36: "042C",
      tag9F37: row.chip_unpredictable_number || "72993948",
    },

    de63: {
      s1: " ",
      s2: row.transaction_id || "MCC6100AA0601",
    },

    de71:  "00000002",
    de72: "TEST DE72",
    de73: row.reason_code || "010101",

    de93:  "035083",
    de94:  "00000002108",

    // ======================
    // PDS
    // ======================
    pds0023: "CT2",

    pds0148: [
      {
        s1:  "036",
        s2: "2",
      },
    ],

    pds0158: {
      s1: "DMC",
      s2: " ",
      s3: "      ",
      s4: "75",
    },

    pds0165: {
      s1: "M",
    },

    pds0170: {
      s1: "8005556666      ",
      s2: "8005556666      ",
    },

    pds0189: {
      s1: "2",
      s2: "TL011 2345556789 MN087 Creditville   NZL",
    },
  };
}

module.exports = { build1240 };