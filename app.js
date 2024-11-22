const fs = require("fs");
const axios = require("axios");
const productRouter = require("./routes/productRoutes");

//Express configuration
const path = require("path");
const express = require("express");

//Creating an object
const app = express();

app.use(express.json());

//Global  Middlewear

//Test middlewear
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//Mounting routeer
app.use("/api/v1/products", productRouter);

module.exports = app;
