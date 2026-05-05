const express = require("express");
const { getMachines } = require("../controllers/machineController");

const router = express.Router();

router.get("/machines", getMachines);

module.exports = router;
