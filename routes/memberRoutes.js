const express = require("express");
const memberRouter = express.Router();

const { addMember } = require("../controllers/memberController");

memberRouter.post("/addMember",addMember);

module.exports = memberRouter;