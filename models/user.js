const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  Name: String,
  Plan: { type: mongoose.Types.ObjectId, ref: "plan" },
  Status: "String",
});

UserSchema.pre("save", async function (next) {
  this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(10));
});

module.exports = mongoose.model("user", UserSchema);
