const axios = require('axios');
const Transaction = require('../models/Transaction');
const {updateTokenHour} = require('./checkAndRefreshToken');
const moment = require('moment-timezone');

const saveDataZoho = async (req, res) => {
    let date = req.query.date;
    console.log("date", date);
    try {

        // Define the date for the query
        //let date = "2024-07-16"; // Change this to the desired date
        let startOfDay = moment.tz(`${date} 00:00`, "America/Mexico_City").toDate();
        let endOfDay = moment.tz(`${date} 23:59`, "America/Mexico_City").toDate();

        console.log("Start of Day: ", startOfDay);
        console.log("End of Day: ", endOfDay);

        // Construct the query
        const query = {
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        };

        // Fetch the transactions
        const transactions = await Transaction.find(query);
        //console.log("Fetched Transactions: ", JSON.stringify(transactions));

        if (transactions.length === 0) {
            console.log("No transactions found for the given date range.");
            return res.status(404).json({ message: "No transactions found for the given date range." });
        }

        const totals = {};

        transactions.forEach(transaction => {
            const data = transaction._doc; // Access the actual data within the transaction document
            Object.keys(data).forEach(key => {
                console.log("Key: ", key);
                if (key.endsWith('total') && data[key] > 0) {
                    if (!totals[key]) {
                        totals[key] = 0;
                    }
                    totals[key] += data[key];
                }
            });
        });

        console.log("Summed Totals: ", totals);

        const lineItems = [];

        Object.keys(totals).forEach(totalKey => {
            const conceptName = totalKey.replace('total', '');
            const { item_id, name } = getItemIdByConcept(conceptName);

            const moneyKey = totalKey.replace('total', '');
            const amountConcept = totals[totalKey];
            lineItems.push({
                item_id: item_id,
                name: name,
                rate: amountConcept,
                quantity: 1
            });
        });

        if (lineItems.length === 0) {
            return res.status(400).json({ message: "No valid concepts found for invoicing" });
        }

    
        // Get the token
        const { lastTokenHour, token } = await updateTokenHour();
        console.log("token: ", token);

        // Construct the invoice data
        const invoiceData = {
            customer_id: "2301987000015815092",
            line_items: lineItems
        };

        const headers = {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'X-Zoho-Organization-Id': "719250654"
        };

        // Send invoice data to Zoho
        const response = await axios.post('https://books.zoho.com/api/v3/invoices?organization_id=719250654', invoiceData, { headers });

        // Respond with Zoho's API response
        const id_invoice = response.data.invoice.invoice_id;
        const maksent = await axios.post('https://books.zoho.com/api/v3/invoices/'+id_invoice+'/status/sent?organization_id=719250654', null,{ headers });
        res.json(maksent);
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
        'peluche': { item_id: '2301987000016487005', name: 'Peluche' },
        'promociones': { item_id: '2301987000016487026', name: 'Promociones' },
        'escape': { item_id: '2301987000016919535', name: 'Escape Room' },
        // Add other concepts as needed
    };

    return conceptItemMap[concept] || { item_id: '2301987000016923001', name: 'Deconocido VirtualityWorld' };
};

module.exports = saveDataZoho;
