// models/User.js
const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  phone: { type: String, required: false },
  firstName: { type: String, required: false },
  lastName: { type: String, required: true },
  phone: { type: String, required: false, unique: true, sparse: true },
  email: { type: String, required: false, unique: true, sparse: true },
}, { timestamps: true

});

const Client = mongoose.model('Client', ClientSchema);

module.exports = Client;
