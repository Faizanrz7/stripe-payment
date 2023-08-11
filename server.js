const express = require("express");

const app = express();
const jwt = require("jsonwebtoken");
const db = require("./config/dbConnect");
const User = require("./models/user");
const Plan = require("./models/plan");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { isAuthenticated } = require("./config/verification");
require("dotenv").config();
const path = require("path");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
app.listen(80, () => console.log(`Server started on port 80...`));
db();

app.get("/", (req, res) => res.json("Hello"));

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// signup
app.post("/api/signup", async (req, res) => {
  const data = req.body;

  try {
    const user = new User({
      email: data.email,
      Name: data.Name,
      password: data.password,
    });

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// login
app.post("/api/login", async (req, res) => {
  try {
    console.log(req.body);
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Email or Password is incorrect" });
    }
    const result = bcrypt.compareSync(req.body.password, user.password);
    if (!result) {
      return res
        .status(401)
        .json({ message: "Email or password is incorrect" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "12h",
    });
    return res.status(200).json({ message: "Logged In", token, User: user });
  } catch (error) {
    res.status(501).json({ error: error.message });
  }
});

app.get("/api/addPlan", async (req, res) => {
  const plan = new Plan({
    Name: "Regular",
    MonthlyPrice: 700,
    YearlyPrice: 7000,
    VideoQuality: "Best",
    Resolution: "4K+HDR",
    Devices: "Phone+Tablet+TV",
    NoOfScreen: 10,
  });

  await plan.save();

  res.json(plan);
});

// get all plan data
// (/allPlan)
app.get("/api/plans", async (req, res) => {
  try {
    const plans = await Plan.find();
    res.status(200).json(plans);
  } catch (error) {
    res.status(501).json(error.message);
  }
});

// subscribe to a subscription
// (subscribe/:planId)
app.post("/api/subscribe/:planId", isAuthenticated, async (req, res) => {
  try {
    const planId = req.params.planId;
    const user = req.user;

    const plan = await Plan.findOne({ _id: planId });
    // console.log(plan);

    const updateUser = await User.findOneAndUpdate(
      {
        _id: user,
      },
      {
        Plan: planId,
        Status: "Active",
      },
      { new: true }
    );
    res.status(200).json(updateUser);
  } catch (error) {
    res.status(501).json(error.message);
  }
});

// get particular user subscription info
// (/myPlans)

app.get("/api/myPlans", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user;

    const userPlan = await User.findOne({ _id: userId }).populate("Plan");

    res.status(200).json(userPlan);
  } catch (error) {
    res.status(501).json(error.message);
  }
});

// cancelSubscription
// (/cancelSubscription)
app.put("/api/cancel/:planId", isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    const planId = req.params.planId;

    const updatedUser = await User.findOneAndUpdate(
      { _id: user, Plan: planId, Status: "Active" },
      { Status: "Canceled" },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(501).json(error.message);
  }
});

app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  const params = {
    payment_method_types: ["card"],
    amount: 100 * 100,
    currency: "inr",
  };

  try {
    const paymentIntent = await stripe.paymentIntents.create(params);

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
      nextAction: paymentIntent.next_action,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.get("/payment/next", async (req, res) => {
  const intent = await stripe.paymentIntents.retrieve(
    req.query.payment_intent,
    {
      expand: ["payment_method"],
    }
  );

  res.redirect(`/success?payment_intent_client_secret=${intent.client_secret}`);
});

app.get("/payment", (req, res) => {
  const filePath = path.resolve(__dirname + "/public/html/payment.html");
  res.sendFile(filePath);
});
