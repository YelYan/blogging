const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

const IndexRoute = require("./routes/index");
const connectDatabase = require("./helpers/database/connectDatabase");
const customErrorHandler = require("./middleware/Errors/customErrorHandler");

dotenv.config({
  path: "./config/config.env",
});

connectDatabase();

const app = express();

const originUrl =
  process.env.NODE_ENV === "development"
    ? process.env.URI || "http://localhost:5173"
    : process.env.URI || "https://bloghub-yelyan.vercel.app/";

app.use(express.json());
app.use(
  cors({
    origin: originUrl,
  })
);

app.use("/api/v1", IndexRoute);

app.use(customErrorHandler);

const PORT = process.env.PORT || 8000;

app.use(express.static(path.join(__dirname, "public")));

const server = app.listen(PORT, () => {
  console.log(`Server running on port  ${PORT} : ${process.env.NODE_ENV}`);
});

process.on("unhandledRejection", (err, promise) => {
  console.log(`Logged Error : ${err}`);

  server.close(() => process.exit(1));
});
