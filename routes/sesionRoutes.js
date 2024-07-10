const express = require('express');
const router = express.Router();
const Sesion = require('../models/Session');
const User = require('../models/Users');
const Transaction = require('../models/Transaction');
const { updateTokenHour } = require('../utils/checkAndRefreshToken');
const axios = require('axios');

const saveDataZoho = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Fetch the session data by ID
        console.log("id " + id);
        const sessionData = await Sesion.findById(id);
        
        if (!sessionData) {
            return res.status(404).json({ message: "Session not found" });
        }

        // Consolidate transaction data by concept
        const concepts = sessionData.concept;
        const lineItems = [];

        concepts.forEach(concept => {
            Object.keys(concept).forEach(key => {
                if (key.endsWith('total') && concept[key] > 0) {
                    const itemKey = key.replace('total', 'money');
                    const qtyKey = key.replace('total', 'qty');
                    const conceptName = key.replace('total', '');
                    const { item_id, name } = getItemIdByConcept(conceptName);  // Assuming you have a function to get item_id and name by concept name

                    lineItems.push({
                        item_id: item_id,
                        name: name,
                        rate: concept[itemKey],
                        quantity: concept[qtyKey]
                    });
                }
            });
        });

        if (lineItems.length === 0) {
            return res.status(400).json({ message: "No valid concepts found for invoicing" });
        }

        // Get the token
        const { lastTokenHour, token } = await updateTokenHour(); 
        console.log("token " + token);
        
        // Construct the invoice data
        const invoiceData = {
            customer_id: "2301987000013004060",
            line_items: lineItems
        };

        const headers = {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'X-Zoho-Organization-Id': "719250654"
        };

        // Send invoice data to Zoho
        const response = await axios.post('https://books.zoho.com/api/v3/invoices?organization_id=719250654', invoiceData, { headers });

        // Respond with Zoho's API response
        res.json(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error);
        res.status(500).json({ message: "Error processing the request" });
    }
};

// Function to map concept name to item_id and name
const getItemIdByConcept = (concept) => {
    const conceptItemMap = {
        'campobatalla': { item_id: '2301987000013028009', name: 'Campo de batalla' },
        'juegos': { item_id: '2301987000014082001', name: 'Juegos' },
        'cabina': { item_id: '2301987000014082018', name: 'Cabina' },
        'tarjeta': { item_id: '2301987000014082035', name: 'Tarjeta' },
        'andador': { item_id: '2301987000014082052', name: 'Andador' },
        'eventos': { item_id: '2301987000014082069', name: 'Eventos' },
        // Add other concepts as needed
    };

    return conceptItemMap[concept] || { item_id: 'default_item_id', name: 'Default Item' };
};

module.exports = saveDataZoho;  // Export the function if needed





router.post('/', async (req, res) => {
    //console.log("req.body " + req.body);
    try {
        const { userId, openingAmount } = req.body;
        console.log("userId " + userId);
        console.log("openingAmount " + openingAmount);
        try {
            const existingUser = await User.findById(userId);
            if (!existingUser) {
                return res.status(404).json({ message: "User not found" });
            }
            const newSesion = new Sesion({
                user: userId,
                openingAmount:openingAmount,
                status: "opening",
                userName: existingUser.firstName + " " + existingUser.lastName,
                dateOpen: new Date()
            });
            await newSesion.save();
            return res.status(201).json(newSesion);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error adding Sesion" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding Sesion" });
    }
}
);

router.get('/', async (req, res) => {
    try {
        const sesions = await Sesion.find();
        res.json(sesions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching Sesion" });
    }
});

router.get('/summary/:id', async (req, res) => {
    const { id } = req.params;
    console.log("id " + id);
    try {
        const sesions = await Sesion.findById(id);
        if (!sesions) {
            return res.status(404).json({ message: "Sesion not found" });
        }
        openingAmount = sesions.openingAmount;
        const transactions = await Transaction.find({ session: id });
        console.log("transactions " + transactions);
        var cashAmount = 0;
        var cardAmount = 0;
        transactions.forEach(transaction => {
            if (transaction.paymentMode == "cash") {
                cashAmount += transaction.amount;
            } else {
                cardAmount += transaction.amount;
            }
        });
       let finalCashAmount = cashAmount + openingAmount;
        res.json({ cashAmount, cardAmount, finalCashAmount,openingAmount });


    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching Sesion" });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { cashAmount,cardAmount} = req.body;
    console.log("cashAmount " + cashAmount);
    console.log("cardAmount " + cardAmount);
    var closingAmount = cashAmount + cardAmount;
    try {
        const updatedSesion = await Sesion.findByIdAndUpdate(
            id,
            { closingAmount,cashAmount,cardAmount, status: "closed", dateClose: new Date()},
            { new: false }
        );
        if (!updatedSesion) {
            return res.status(404).json({ message: "Sesion not found" });
        }

       await saveDataZoho(res, { req });
        res.json(updatedSesion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating Sesion" });
    }
});

router.post('/testing', async (req, res) => {
    try{
    
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error saving data" });
    }
}
);

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log("id " + id);
    try {
        const sesion = await Sesion.findById(id);
        if (!sesion) {
            return res.status(404).json({ message: "Sesion not found" });
        }
        res.json(sesion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching Sesion" });
    }
});


module.exports = router;
