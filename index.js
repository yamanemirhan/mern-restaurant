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
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

app.use("/api", routes);
app.use(customErrorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
