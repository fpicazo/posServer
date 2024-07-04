const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
date: { type: Date, required: true },
game : { type: String, required: false },
location: { type: String, required: false },
startDate: { type: Date, required: false },
endDate: { type: Date, required: false },
participantsbooked: { type: Number, required: false },
availableparticipants: { type: Number, required: false },
comment: { type: String, required: false },
status: { type: String, required: true, default:"booked" }, // booked or cancelled or pending
}, { timestamps: true

});

const Reservations = mongoose.model('Reservations', ReservationSchema);

module.exports = Reservations;
