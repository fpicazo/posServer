const mongoose = require('mongoose');

const ReservationCourseSchema = new mongoose.Schema({
idBranch: { type: String, required: true },
players: {  type: Number, required: true  },
date: { type: Date, required: true },
course : { type: String, required: false },
location: { type: String, required: false },
startDate: { type: Date, required: false },
endDate: { type: Date, required: false },
idSchedule: { type: String, required: true },
client: { type: Object },
contactPhone: { type: String, required: true },
contactEmail: { type: String, required: true },
contactName: { type: String, required: true },
status: { type: String, required: true, default:"booked" } // booked or cancelled or pending

}, { timestamps: true

});

const ReservationCourse = mongoose.model('ReservationCourse', ReservationCourseSchema);

module.exports = ReservationCourse;
