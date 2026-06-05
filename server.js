const express = require("express");
const path = require("path");
const fs = require("fs");

const { generateIPM } = require("./ipmService");

const app = express();
app.use(express.json());

app.post("/generate-ipm", async (req, res) => {
  try {
    const { pan , aliaspan } = req.body;

    const file = await generateIPM(pan, aliaspan);

    return res.download(path.resolve(file), () => {
      // optional cleanup
      fs.unlinkSync(file);
    });

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.listen(3000, () => {
  console.log("IPM API running on port 3000");
});