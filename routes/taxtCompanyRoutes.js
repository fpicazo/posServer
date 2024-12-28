const express = require('express');
const router = express.Router();
const TaxCompany = require('../models/taxCompanyModel');


// Get all TaxCompany
router.get('/', async (req, res) => {
    try {
        const taxCompany = await TaxCompany.find({});
        console.log( '---------------------' )
        console.log( taxCompany )
        res.status(200).json(taxCompany);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});  

router.get('/:id', async (req, res) => {
    try {

        const { id } = req.params;

        const taxCompany = await TaxCompany.findById(id);
        res.status(200).json(taxCompany);
        

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/', async (req, res) => {
    try {
        
        const { _id, tradeName, taxName, rfc, address, taxRegime, cfdi, email } = req.body;

        const taxCompany = TaxCompany({ 
            tradeName: tradeName, 
            taxName: taxName, 
            rfc: rfc, 
            address: address, 
            taxRegime: taxRegime, 
            cfdi: cfdi, 
            email: email
        });
        await taxCompany.save();

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.put('/', async (req, res) => {
    try {
        const { _id, tradeName, taxName, rfc, address, taxRegime, cfdi, email } = req.body;

        await TaxCompany.findByIdAndUpdate(_id, { 
            tradeName: tradeName, 
            taxName: taxName, 
            rfc: rfc, 
            address: address, 
            taxRegime: taxRegime, 
            cfdi: cfdi, 
            email: email
         });

        res.status(200).json({ menaje: 'ok' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


module.exports = router;
