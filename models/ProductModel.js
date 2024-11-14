// models/User.js
const mongoose = require('mongoose');

const productsSchema = new mongoose.Schema({
  nameProduct: { type: String, required: true },
  price: { type: Number, required: true },
  type: { type: String, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: false }
}, { timestamps: true

});

const Product = mongoose.model('product', productsSchema);

module.exports = Product;
