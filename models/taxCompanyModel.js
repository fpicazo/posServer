const mongoose = require('mongoose');

const taxCompanySchema = new mongoose.Schema(
    {
        tradeName: { type: String, required: true },
        taxName: { type: String, required: true },
        rfc: { type: String, required: true },
        address: { type: String, required: true },
        taxRegime: { type: String, required: true },
        cfdi: { type: String, required: true },
        email: { type: String, required: true },
    }, 
    { 
        timestamps: true
    }
);

const Rooms = mongoose.model('taxCompany', taxCompanySchema);

module.exports = Rooms;
