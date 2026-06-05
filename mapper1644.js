function formatDateToYYMMDD(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return yy + mm + dd;
}

function build1644(rows, type) {

  const today = formatDateToYYMMDD();

  return rows.map((r, idx) => ({

    mti: "1644",

    de24: type === "PRE" ? "697" : "695",

    de71: String(idx + 1).padStart(8, "0"),

    pds0105: {
      s1: "002",

      // sysdate
      s2: today,

      // increment each time
      s3: String(2108 + idx).padStart(11, "0"),

      s4: "00001"
    },

    ...(type === "PRE"
      ? {
          pds0122: "T"
        }
      : {
          pds0301: "0000000000015000",

          pds0306: String(idx + 1).padStart(8, "0")
        })
  }));
}

module.exports = { build1644 };