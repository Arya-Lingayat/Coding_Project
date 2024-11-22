const Product = require("./../model/productModel");
const axios = require("axios");

// URL to fetch data from
const dataUrl = "https://s3.amazonaws.com/roxiler.com/product_transaction.json";

const getMonthNumber = (monthName) => {
  const formattedMonth =
    monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase();

  return new Date(`${formattedMonth} 1, 2024`).getMonth() + 1;
};

exports.init = async (req, res) => {
  try {
    // Fetch data from the URL
    const response = await axios.get(dataUrl);
    const products = response.data;

    //Clearing Existing data
    await Product.deleteMany({});

    // Inserting new data fetched from API
    await Product.insertMany(products);
    console.log(products);
    console.log("Data successfully seeded.");

    res.status(200).json({
      status: "success",
      count: products.length,
    });
  } catch (error) {
    res.status(500).send({
      message: "Failed to initialize database.",
      error: error.message,
    });
  }
  process.exit();
};

exports.getAllProducts = async (req, res) => {
  try {
    //Filtering
    const queryObj = { ...req.query };
    const excludedFields = ["page", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    //Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    let query = Product.find(JSON.parse(queryStr));

    //Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    // Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numProducts = await Product.countDocuments();
      if (skip > numProducts) throw new Error(`This page does not exist.`);
    }

    //Executing query
    const products = await query;

    res.status(200).json({
      status: "success",
      results: products.length,
      data: {
        products,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getMonthlyStats = async (req, res) => {
  try {
    const monthNumber = getMonthNumber(req.params.month);

    if (!monthNumber) {
      throw new Error("Invalid month name");
    }

    const stats = await Product.aggregate([
      {
        $addFields: {
          month: { $month: "$dateOfSale" }, // Extracting month
        },
      },
      {
        $match: { month: monthNumber }, // Filter by the given month
      },
      {
        $group: {
          _id: null,
          totalSale: {
            $sum: {
              $cond: [{ $eq: ["$sold", true] }, "$price", 0], // Sum of prices of sold items only
            },
          },
          totalSoldItems: {
            $sum: {
              $cond: [{ $eq: ["$sold", true] }, 1, 0], // Counting sold items
            },
          },
          totalUnsoldItems: {
            $sum: {
              $cond: [{ $eq: ["$sold", false] }, 1, 0], // Counting unsold items
            },
          },
        },
      },

      {
        $project: { _id: 0 },
      },
    ]);

    res.status(200).json({
      status: "success",
      results: stats.length,
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getBarChartStats = async (req, res) => {
  try {
    const monthNumber = getMonthNumber(req.params.month);

    if (!monthNumber) {
      throw new Error("Invalid month name");
    }

    const stats = await Product.aggregate([
      {
        $addFields: {
          month: { $month: "$dateOfSale" },
        },
      },
      {
        $match: { month: monthNumber },
      },
      {
        $bucket: {
          groupBy: "$price", // Grouping documents by the price.
          boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901], // price range boundaries
          default: "901 and above", // Label for prices above the highest boundary
          output: {
            count: { $sum: 1 }, // Counting the number of items in each range
          },
        },
      },
      {
        $project: {
          range: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$_id", 0] },
                  then: "0-100",
                },
                {
                  case: { $eq: ["$_id", 101] },
                  then: "101-200",
                },
                {
                  case: { $eq: ["$_id", 201] },
                  then: "201-300",
                },
                {
                  case: { $eq: ["$_id", 301] },
                  then: "301-400",
                },
                {
                  case: { $eq: ["$_id", 401] },
                  then: "401-500",
                },
                {
                  case: { $eq: ["$_id", 501] },
                  then: "501-600",
                },
                {
                  case: { $eq: ["$_id", 601] },
                  then: "601-700",
                },
                {
                  case: { $eq: ["$_id", 701] },
                  then: "701-800",
                },
                {
                  case: { $eq: ["$_id", 801] },
                  then: "801-900",
                },
              ],
              default: "901 and above", // For prices above 900
            },
          },
          numItems: "$count", // Including the count field in the output
          _id: 0, // Excluding _id
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getPieChartStats = async (req, res) => {
  console.log("hey");
  try {
    const monthNumber = getMonthNumber(req.params.month);

    if (!monthNumber) {
      throw new Error("Invalid month name");
    }

    const stats = await Product.aggregate([
      {
        $addFields: {
          month: { $month: "$dateOfSale" },
        },
      },
      {
        $match: { month: monthNumber },
      },

      {
        $group: {
          _id: "$category",
          totalItems: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalItems: 1,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

// New route to get combined stats
exports.getAllStats = async (req, res) => {
  try {
    const { month } = req.params;
    if (!month) {
      throw new Error("Provide a month");
    }
    // Fetch the stats from all three routes using Promise.all
    const requests = [
      axios.get(
        `${req.protocol}://localhost:3000/api/v1/products/get-monthly-stats/${month}`
      ),
      axios.get(
        `${req.protocol}://localhost:3000/api/v1/products/get-bar-chart-stats/${month}`
      ),
      axios.get(
        `${req.protocol}://localhost:3000/api/v1/products/get-pie-chart-stats/${month}`
      ),
    ];

    const [monthlyStatsResponse, barChartStatsResponse, pieChartStatsResponse] =
      await Promise.all(requests);

    // Combine the results into a single object
    const combinedStats = {
      monthlyStats: monthlyStatsResponse.data,
      barChartStats: barChartStatsResponse.data,
      pieChartStats: pieChartStatsResponse.data,
    };

    // Send the combined response
    res.status(200).json({
      status: "success",
      data: {
        combinedStats,
      },
    });
  } catch (error) {
    console.error("Error while fetching combined stats:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching combined stats." });
  }
};
