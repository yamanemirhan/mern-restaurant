const express = require("express");
const dotenv = require("dotenv");
const routes = require("./routes");
const cors = require("cors");
const connectDatabase = require("./helpers/database/connectDb");
const customErrorHandler = require("./middlewares/errors/customErrorHandler");
const cookieParser = require("cookie-parser");

dotenv.config({
  path: "./config/env/config.env",
});

connectDatabase();

const app = express();

app.use(
  cors({
    origin: "https://mern-restaurant.netlify.app",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));

app.use("/api", routes);
app.use(customErrorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});

// STRIPE
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});
app.post("/create-payment-intent", async (req, res) => {
  const { amount, orderId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "USD",
      amount: amount * 100,
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId,
      },
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});
