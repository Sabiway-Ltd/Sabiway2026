// routes/search.routes.js

const express = require("express");
const router = express.Router();
const controller = require("../controllers/search.controller");

// GET /api/search?q=xxx&type=posts|profiles|hashtags
router.get("/", controller.search);

module.exports = router;
