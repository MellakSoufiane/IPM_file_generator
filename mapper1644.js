function formatDateToYYMMDD(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return yy + mm + dd;
}

function build1644(rows, type) {
  const today = formatDateToYYMMDD();

  const base = {
    mti: "1644",
    de71: "00000001",
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
      pds0122: "T"
    };
  }

  return {
    ...base,
    de24: "695",
    pds0301: "0000000000015000",
    pds0306: "00000001"
  };
}

module.exports = { build1644 };