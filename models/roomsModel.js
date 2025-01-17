const mongoose = require('mongoose');

const roomsSchema = new mongoose.Schema(
    {
        idBranches: { type: String },
        nameRooms: { type: String, required: true },
        type: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        costs: { type: Array, required: true },
        certificateNom: { type: String, required: true },
        certificateNameCostMembership: { type: Number, required: true },
        certificateNomCostNormal: { type: Number, required: true }
    }, 
    { 
        timestamps: true
    }
);

const Rooms = mongoose.model('rooms', roomsSchema);

module.exports = Rooms;
