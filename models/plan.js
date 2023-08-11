const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const PlanSchema = new mongoose.Schema({
  Name: String,
  MonthlyPrice: Number,
  YearlyPrice: Number,
  VideoQuality: String,
  Resolution: String,
  Devices: String,
  NoOfScreen: Number,
});

module.exports = mongoose.model("plan", PlanSchema);
