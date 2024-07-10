const express = require('express');
const router = express.Router();
const { updateTokenHour } = require('../utils/checkAndRefreshToken');
const axios = require('axios');



router.post('/confirmation', async (req, res) => {
    const { email,nombre,hour,game } = req.body
    const { lastTokenHour, token } = await updateTokenHour();

    try {
    const headers = {
        'Authorization': `Zoho-oauthtoken ${token}`
        };

    emailData = {
            "data": [
                {
                    "from": {
                        "user_name": "Virtuality World",
                        "email": "ricardo.garate@maxadhoc.com"
                    },
                    "to": [
                        {
                            "user_name": nombre,
                            "email": email
                        }
                    ],
                    "subject": "Rserva Confirmada!",
                    "content": "Hola "+nombre+"! <br><br>Gracias por tu reserva, te esperamos el dia "+hour+" para jugar a "+game+"!<br><br>Saludos!",
                    "org_email": true,
                    "template": {
                        "id": "3801110000045094299"
                    }
                }
            ]
        }

    // Send invoice data to Zoho
    const response = await axios.post('https://www.zohoapis.com/crm/v6/Contacts/3801110000049222092/actions/send_mail', emailData, { headers });

    // Respond with Zoho's API response
    res.json(response.data);
} catch (error) {
    console.error(error.response ? error.response.data : error);
    res.status(500).json({ message: "Error processing the request" });
}
});

router.post('/error', async (req, res) => {
    const { email,nombre,hour,game } = req.body
    const { lastTokenHour, token } = await updateTokenHour();

    try {
    const headers = {
        'Authorization': `Zoho-oauthtoken ${token}`
        };

    emailData = {
            "data": [
                {
                    "from": {
                        "user_name": "Virtuality World",
                        "email": "ricardo.garate@maxadhoc.com"
                    },
                    "to": [
                        {
                            "user_name": nombre,
                            "email": email
                        }
                    ],
                    "subject": "Error en la Reserva de su juego en Virtuality World!",
                    "content": "Hola "+nombre+"!<br><br> Tu reserva de "+hour+" para jugar a "+game+". No se ha podido realizar, por favor contacta con nosotros para solucionar el problema.",
                    "org_email": true,
                    "template": {
                        "id": "3801110000045094299"
                    }
                }
            ]
        }

    // Send invoice data to Zoho
    const response = await axios.post('https://www.zohoapis.com/crm/v6/Contacts/3801110000049222092/actions/send_mail', emailData, { headers });

    // Respond with Zoho's API response
    res.json(response.data);
} catch (error) {
    console.error(error.response ? error.response.data : error);
    res.status(500).json({ message: "Error processing the request" });
}
});


module.exports = router;
