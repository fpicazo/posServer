const mongoose = require('mongoose');
const typesSchema = new mongoose.Schema(
    {
        type: { type: String, required: true, unique: true },
        order: { type: Number, required: true },
        image: { type: String, required: true }
    }, 
    { 
        timestamps: true
    }
);
const Types = mongoose.model('types', typesSchema);
module.exports = Types;
