
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;
const ROOT = __dirname;
const INDEX = path.join(ROOT, "index.html");

app.use(express.json({ limit: "2mb" }));

if (!fs.existsSync(INDEX)) {
  console.error("ERROR: No se encontró index.html en:", ROOT);
}

app.use(express.static(ROOT, { index: false }));

app.get("/", (req, res) => {
  if (!fs.existsSync(INDEX)) {
    return res.status(500).send("Error: Render no encuentra index.html en la carpeta principal.");
  }
  res.sendFile(INDEX);
});

app.get("/health", (req, res) => {
  res.status(200).send("GusGus funcionando");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("GusGus iniciado en puerto:", PORT);
  console.log("Carpeta del proyecto:", ROOT);
  console.log("index.html existe:", fs.existsSync(INDEX));
});
