const express = require("express");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

//creating a razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const port = process.env.PORT || 3002;

app.post("/create-order", async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;
    const options = {
      amount: amount * 100,
      currency,
      receipt,
    };
    const order = await razorpay.orders.create(options); //creating the order
    if (!order) {
      return res
        .status(401)
        .json({ status: false, msg: "Failed to create order" });
    }
    res
      .status(201)
      .json({ status: true, msg: "order created successfully", order });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: "Internal Server Error", err: error.message });
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const secret = process.env.RAZORPAY_SECRET_KEY;
    //crypto is used to gen signtures, here we are compare signatures of razorpay and crypto gen's
    const generateSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    if (generateSignature === razorpay_signature) {
      console.log("clickedd");
      return res.status(201).json({ msg: "payment success", status: true });
    }
    res.status(401).json({ msg: "Payment Failed", status: false });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ msg: "Internal Server Error", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is Running at port ${port}`);
});
