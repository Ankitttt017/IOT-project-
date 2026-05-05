const express = require("express");
const cors = require("cors");
require("dotenv").config();

const partRoutes = require("./src/routes/partRoutes");
const machineRoutes = require("./src/routes/machine");

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use("/api", partRoutes);
app.use("/api", machineRoutes);

app.get("/", (req, res) => res.json({ message: "RICO Part Master API Running" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
