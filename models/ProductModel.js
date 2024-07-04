// models/User.js
const mongoose = require('mongoose');

const productsSchema = new mongoose.Schema({
  nameProduct: { type: String, required: true },
  price: { type: Number, required: true },
}, { timestamps: true

});

const Product = mongoose.model('product', productsSchema);

module.exports = Product;
