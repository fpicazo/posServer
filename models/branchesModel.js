// models/User.js
const mongoose = require('mongoose');

const branchesSchema = new mongoose.Schema(
    {
        nameBranches: { type: String, required: true },
        state: { type: String, required: true },
        address: { type: String, required: true }
    }, 
    { 
        timestamps: true
    }
);

const Branches = mongoose.model('branches', branchesSchema);

module.exports = Branches;
