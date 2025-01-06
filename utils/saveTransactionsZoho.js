const axios = require('axios');
const Transaction = require('../models/Transaction');
const {updateTokenHour} = require('./checkAndRefreshToken');
const moment = require('moment-timezone');
const Types = require('../models/typesModel');

const saveDataZoho = async (req, res) => {
    let date = req.query.date;
    let sucursal = req.query.sucursal;
    console.log("date", date, "sucursal", sucursal);
    try {

        // Define the date for the query
        //let date = "2024-07-16"; // Change this to the desired date
        let startOfDay = moment.tz(`${date} 00:00`, "America/Mexico_City").toDate();
        let endOfDay = moment.tz(`${date} 23:59`, "America/Mexico_City").toDate();

        console.log("Start of Day: ", startOfDay);
        console.log("End of Day: ", endOfDay);

        // Construct the query
        const query = {
            createdAt: { $gte: startOfDay, $lte: endOfDay }, sucursal: sucursal
        };
        console.log( JSON.stringify(query) );

        // Fetch the transactions
        let transactions = await Transaction.find(query);
        // console.log("Fetched Transactions: ", JSON.stringify(transactions));

        if (transactions.length === 0) {
            console.log("No transactions found for the given date range.");
            return res.status(404).json({ message: "No transactions found for the given date range." });
        }

        // new
        const types = await Types.find({});
        let encabezadosTipos = [];
        types.sort((a, b) => a.order - b.order).map( ( r ) => {
            encabezadosTipos = [ ...encabezadosTipos, {
            tipo: r.type,
            cantidad: `${r.type} Cantidad`,
            precio: `${r.type} Precio`,
            total: `${r.type} total`
            } ];
        } );

        let fetchedTransaccionesNew = [];
        transactions.map( ( row ) => {
            let fila = {};

            fila._id = row._id;
            fila.location = row.location;
            fila.date = row.date;
            fila.amount = row.amount;

            if( row.concepts.length > 0 ){
            encabezadosTipos.map( ( a ) => {
                let cuenta = row.concepts.find( x => x.type === a.tipo );
                if( cuenta ){
                fila[a.cantidad] = cuenta.qty;
                fila[a.precio] = cuenta.money;
                fila[a.total] = cuenta.total;
                }else{
                fila[a.cantidad] = 0;
                fila[a.precio] = 0;
                fila[a.total] = 0;
                }
            } )
            }else{

            fila['Campo de Batalla Cantidad'] = row.campobatallaqty;
            fila['Campo de Batalla Precio'] = row.campobatallamoney;
            fila['Campo de Batalla total'] = row.campobatallatotal;

            fila['Maquinas Cantidad'] = row.juegosqty;
            fila['Maquinas Precio'] = row.juegosmoney;
            fila['Maquinas total'] = row.juegostotal;

            fila['Cabinas Inmersivas Cantidad'] = row.cabinaqty;
            fila['Cabinas Inmersivas Precio'] = row.cabinamoney;
            fila['Cabinas Inmersivas total'] = row.cabinatotal;

            fila['Tarjeta Cantidad'] = row.tarjetaqty;
            fila['Tarjeta Precio'] = row.tarjetamoney;
            fila['Tarjeta total'] = row.tarjetatotal;

            fila['Andador Virtual Cantidad'] = row.andadorqty;
            fila['Andador Virtual Precio'] = row.andadormoney;
            fila['Andador Virtual total'] = row.andadortotal;

            fila['Eventos Cantidad'] = row.eventosqty;
            fila['Eventos Precio'] = row.eventosmoney;
            fila['Eventos total'] = row.eventostotal;

            fila['Peluche Cantidad'] = row.pelucheqty;
            fila['Peluche Precio'] = row.peluchemoney;
            fila['Peluche total'] = row.peluchetotal;

            fila['Promociones Cantidad'] = row.promocionqty;
            fila['Promociones Precio'] = row.promocionmoney;
            fila['Promociones total'] = row.promociontotal;

            fila['Escape Cantidad'] = row.escapeqty;
            fila['Escape Precio'] = row.escapemoney;
            fila['Escape total'] = row.escapetotal;

            fila['Alimentos Cantidad'] = 0;
            fila['Alimentos Precio'] = 0;
            fila['Alimentos total'] = 0;

            fila['Bebidas Cantidad'] = 0;
            fila['Bebidas Precio'] = 0;
            fila['Bebidas total'] = 0;


            }

            fila.idinterno = row.idinterno;
            fila.session = row.session;
            fila.tc = row.tc;
            fila.sucursal = row.sucursal;
            fila.paymentMode = row.paymentMode;
            fila.client = row.client;
            fetchedTransaccionesNew = [ ...fetchedTransaccionesNew, fila ];

        } );


        const totals = {};
        transactions.forEach(transaction => {
            const data = transaction._doc; // Access the actual data within the transaction document
            Object.keys(data).forEach(key => {
                // console.log("Key: ", key);
                if (key.endsWith('total') && data[key] > 0) {
                    if (!totals[key]) {
                        totals[key] = 0;
                    }
                    totals[key] += data[key];
                }
            });
        });
        console.log("Summed Totals: ", totals);

        const totalsNew = {};
        fetchedTransaccionesNew.forEach(transaction => {
            const data = transaction; // Access the actual data within the transaction document
            Object.keys(data).forEach(key => {
                // console.log("Key: ", key);
                if (key.endsWith('total') && data[key] > 0) {
                    if (!totalsNew[key]) {
                        totalsNew[key] = 0;
                    }
                    totalsNew[key] += data[key];
                }
            });
        });
        console.log("Summed Totals: ", totalsNew);

        const lineItems = [];
        Object.keys(totals).forEach(totalKey => {
            const conceptName = totalKey.replace('total', '');
            const { item_id, name } = getItemIdByConcept(conceptName,sucursal);

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

        const lineItemsNew = [];
        Object.keys(totalsNew).forEach(totalKey => {
            const conceptName = totalKey.replace('total', '');
            const { item_id, name } = getItemIdByConcept(conceptName,sucursal);

            const moneyKey = totalKey.replace('total', '');
            const amountConcept = totalsNew[totalKey];
            lineItemsNew.push({
                item_id: item_id,
                name: name,
                rate: amountConcept,
                quantity: 1
            });
        });

        if (lineItemsNew.length === 0) {
            return res.status(400).json({ message: "No valid concepts found for invoicing" });
        }

        // console.log(
        //     { 
        //         "dataVieja": { 
        //             "dataT": transactions.length,
        //             "data": transactions,
        //             "dataMontos": totals,
        //             "array": lineItems
        //         },
        //         "dataNueva": { 
        //             "dataT": fetchedTransaccionesNew.length,
        //             "data": fetchedTransaccionesNew,
        //             "dataMontos": totalsNew,
        //             "array": lineItemsNew
        //         }
        //     }
        //  );

        // Get the token
        const { lastTokenHour, token } = await updateTokenHour();
        console.log("token: ", token);

        if (sucursal === '6735e8fe3cbf3096493afa5e') {
          var  customer_id = "2301987000015815092";
        } else if (sucursal === '6767682b3b3a0a728a7025f6') {
            customer_id = "2301987000020222170";
        }

        // Construct the invoice data
        const invoiceData = {
            customer_id: customer_id,
            line_items: lineItemsNew,
            date:date,
        };

        const headers = {
            'Authorization': `Zoho-oauthtoken ${token}`,
            'X-Zoho-Organization-Id': "719250654"
        };

        console.log("invoiceData: ", invoiceData);

        // Send invoice data to Zoho
        const response = await axios.post('https://books.zoho.com/api/v3/invoices?organization_id=719250654', invoiceData, { headers });
        // console.log( response.data.invoice.invoice_id );

        // // Respond with Zoho's API response
        const id_invoice = response.data.invoice.invoice_id;
        const maksent = await axios.post('https://books.zoho.com/api/v3/invoices/'+ id_invoice +'/status/sent?organization_id=719250654', null,{ headers });
        // console.log(  )
        res.json(maksent.data);

        // res.json({ 
        //     "dataVieja": { 
        //         "dataT": transactions.length,
        //         "data": transactions,
        //         "dataMontos": totals,
        //         "array": lineItems
        //     },
        //     "dataNueva": { 
        //         "dataT": fetchedTransaccionesNew.length,
        //         "data": fetchedTransaccionesNew,
        //         "dataMontos": totalsNew,
        //         "array": lineItemsNew
        //     }
        // });

        
        

        

    } catch (error) {
        console.error(error.response ? error.response.data : error);
        res.status(500).json({ message: "Error processing the request" });
    }
};

// Function to map concept name to item_id and name
const getItemIdByConcept = (concept,sucursal) => {

    var conceptItemMap = {};
    console.log("sucursal -- ", sucursal);

    if(sucursal === '6735e8fe3cbf3096493afa5e'){

    conceptItemMap = {
        'campobatalla': { item_id: '2301987000013028009', name: 'Campo de batalla' },
        'Campo de Batalla': { item_id: '2301987000013028009', name: 'Campo de batalla' },

        'juegos': { item_id: '2301987000014082001', name: 'Juegos' },
        'Maquinas': { item_id: '2301987000014082001', name: 'Juegos' },

        'cabina': { item_id: '2301987000014082018', name: 'Cabina' },
        'Cabinas Inmersivas': { item_id: '2301987000014082018', name: 'Cabina' },

        'tarjeta': { item_id: '2301987000014082035', name: 'Tarjeta' },
        'Tarjeta': { item_id: '2301987000014082035', name: 'Tarjeta' },

        'andador': { item_id: '2301987000014082052', name: 'Andador' },
        'Andador Virtual': { item_id: '2301987000014082052', name: 'Andador' },

        'eventos': { item_id: '2301987000014082069', name: 'Eventos' },
        'Eventos': { item_id: '2301987000014082069', name: 'Eventos' },

        'escape': { item_id: '2301987000016919535', name: 'Escape Room' },
        'Escape': { item_id: '2301987000016919535', name: 'Escape Room' },

        'peluche': { item_id: '2301987000016487005', name: 'Peluche' },
        'Peluche': { item_id: '2301987000016487005', name: 'Peluche' },

        'promociones': { item_id: '2301987000016487026', name: 'Promociones' },
        'Promocion': { item_id: '2301987000016487026', name: 'Promociones' },

        'escape': { item_id: '2301987000019413551', name: 'Escape Room' },
        'Escape': { item_id: '2301987000019413551', name: 'Escape Room' },
        // Add other concepts as needed
    };
} else if(sucursal === '6767682b3b3a0a728a7025f6'){

    conceptItemMap = {
        'campobatalla': { item_id: '2301987000020222209', name: 'Campo de batalla' },
        'Campo de Batalla': { item_id: '2301987000020222209', name: 'Campo de batalla' },

        'juegos': { item_id: '2301987000020222228', name: 'Juegos' },
        'Maquinas': { item_id: '2301987000020222228', name: 'Juegos' },

        'cabina': { item_id: '2301987000020222247', name: 'Cabina' },
        'Cabinas Inmersivas': { item_id: '2301987000020222247', name: 'Cabina' },

        'tarjeta': { item_id: '2301987000020222266', name: 'Tarjeta' },
        'Tarjeta': { item_id: '2301987000020222266', name: 'Tarjeta' },

        'andador': { item_id: '2301987000020222291', name: 'Andador' },
        'Andador Virtual': { item_id: '2301987000020222291', name: 'Andador' },

        'eventos': { item_id: '2301987000020222310', name: 'Eventos' },
        'Eventos': { item_id: '2301987000020222310', name: 'Eventos' },

        'escape': { item_id: '2301987000020222190', name: 'Escape Room' },
        'Escape': { item_id: '2301987000020222190', name: 'Escape Room' },

        'peluche': { item_id: '2301987000020222329', name: 'Peluche' },
        'Peluche': { item_id: '2301987000020222329', name: 'Peluche' },

        'promociones': { item_id: '2301987000020222348', name: 'Promociones' },
        'Promocion': { item_id: '2301987000020222348', name: 'Promociones' },
        // Add other concepts as needed
    };
}
else if(sucursal === '676a75a28854b17ed8727f62'){

    conceptItemMap = {
        'campobatalla': { item_id: '2301987000020466007', name: 'Campo de batalla' },
        'Campo de Batalla': { item_id: '2301987000020466007', name: 'Campo de batalla' },

        'juegos': { item_id: '2301987000020466026', name: 'Juegos' },
        'Maquinas': { item_id: '2301987000020466026', name: 'Juegos' },

        'cabina': { item_id: '2301987000020466045', name: 'Cabina' },
        'Cabinas Inmersivas': { item_id: '2301987000020466045', name: 'Cabina' },

        'tarjeta': { item_id: '2301987000020466064', name: 'Tarjeta' },
        'Tarjeta': { item_id: '2301987000020466064', name: 'Tarjeta' },

        'andador': { item_id: '2301987000020466083', name: 'Andador' },
        'Andador Virtual': { item_id: '2301987000020466083', name: 'Andador' },

        'eventos': { item_id: '2301987000020466102', name: 'Eventos' },
        'Eventos': { item_id: '2301987000020466102', name: 'Eventos' },

        'escape': { item_id: '2301987000020466121', name: 'Escape Room' },
        'Escape': { item_id: '2301987000020466121', name: 'Escape Room' },

        'peluche': { item_id: '2301987000020466140', name: 'Peluche' },
        'Peluche': { item_id: '2301987000020466140', name: 'Peluche' },

        'promociones': { item_id: '2301987000020466159', name: 'Promociones' },
        'Promocion': { item_id: '2301987000020466159', name: 'Promociones' },
        // Add other concepts as needed
    };
}

    return conceptItemMap[concept.trim()] || { item_id: 'default_item_id', name: 'Default Item' };
};

module.exports = saveDataZoho;


