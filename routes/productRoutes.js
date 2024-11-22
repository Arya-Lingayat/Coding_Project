const express = require("express");
const axios = require("axios");
const productController = require("./../controllers/productController");
const router = express.Router();

// URL to fetch data from
const dataUrl = "https://s3.amazonaws.com/roxiler.com/product_transaction.json";

router.get("/init", productController.init);
router.get("/", productController.getAllProducts);
router
  .route("/get-monthly-stats/:month")
  .get(productController.getMonthlyStats);

router
  .route("/get-bar-chart-stats/:month")
  .get(productController.getBarChartStats);

router
  .route("/get-pie-chart-stats/:month")
  .get(productController.getPieChartStats);

router.route("/get-all-stats/:month").get(productController.getAllStats);
module.exports = router;
