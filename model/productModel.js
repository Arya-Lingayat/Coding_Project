const mongoose = require("mongoose");
const validator = require("validator");

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: [true, "Please provide an ID"],
  },
  title: {
    type: String,
    required: [true, "Please provide a title"],
  },
  price: {
    type: Number,
    required: [true, "A product must have a price"],
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: [true, "A product must have a category"],
  },
  image: {
    type: String,
    required: [true, "A product must have an image"],
  },
  sold: {
    type: Boolean,
    default: false,
  },
  dateOfSale: Date,
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
