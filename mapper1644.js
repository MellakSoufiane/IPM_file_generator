function formatDateToYYMMDD(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return yy + mm + dd;
}

function build1644(type, trailerData = {}) {
  const today = formatDateToYYMMDD();

  const base = {
    mti: "1644",
    pds0105: {
      s1: "002",
      s2: today,
      s3: "00000002108",
      s4: "00001"
    }
  };

  if (type === "PRE") {
    return {
      ...base,
      de24: "697",
      de71: "00000001",
      pds0122: "T"
    };
  }

  return {
    ...base,
    de24: "695",
    de71: "00000003",
    pds0301: String(trailerData.totalAmount || 0).padStart(16, "0"),
    pds0306: String(trailerData.totalTransactions || 0).padStart(8, "0")
  };
}

module.exports = { build1644 };