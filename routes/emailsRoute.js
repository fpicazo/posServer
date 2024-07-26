const express = require('express');
const router = express.Router();
const { updateTokenHour } = require('../utils/checkAndRefreshToken');
const axios = require('axios');



router.post('/confirmation', async (req, res) => {
    const { email,clientName,hour,game } = req.body
    console.log("email: "+email);
    const { lastTokenHour, token } = await updateTokenHour();
    var location = req.body.location || "Tepic Plaza Forum";

    const messageContent = `
    Hola ${clientName},
    <br><br>
    ¡Gracias por reservar en Virtuality World ${location}. Tu recibo de reserva está abajo.
    <br><br>
    Recomendamos encarecidamente a los huéspedes que lleguen 10-15 minutos antes de la hora de inicio de su reserva. Tenemos una estricta política de período de gracia de 5 minutos para tu reserva. Debido a la alta demanda, cualquier retraso superior a 5 minutos podría resultar en la cancelación de tu reserva para asegurar que las citas de nuestros otros huéspedes no se vean afectadas.
    <br>
    Usa ropa ligera y cómoda para que puedas moverte libre y cómodamente.
    <br><br>
    LUGAR:
    <br>
    Dirección: Blvrd. Luis Donaldo Colosio 680, Benito Juárez Oriente, 63175 Tepic, Nay. - PLAZA FORUM TEPIC.
    <br>
    Estamos ubicados en el segundo nivel a un lado de Cinemex.
    <br><br>
    POLÍTICA DE CANCELACIÓN: Debido a las reservas limitadas, solicitamos que canceles al menos 72 horas antes de tu reserva programada.
    <br><br>
    Si cancelas al menos 72 horas antes de tu reserva, se emitirá un reembolso completo al método de pago original o se aplicará a un vale para una futura reserva.
    <br>
    Si cancelas entre 24-72 horas, se te cobrará una tarifa de $500 pesos y el saldo de tu pago se aplicará a un vale para una futura reserva.
    <br>
    Las cancelaciones o reprogramaciones realizadas en menos de 24 horas NO SERÁN REEMBOLSADAS.
    <br><br>
    Todos los huéspedes que no se presenten incurrirán en la cancelación automática de la reserva y no se emitirá ningún reembolso.
    <br><br>
    Saludos cordiales,
    <br>
    Virtuality World - Tepic Plaza Forum`;


    try {
    const headers = {
        'Authorization': `Zoho-oauthtoken ${token}`
        };

    emailData = {
            "data": [
                {
                    "from": {
                        "user_name": "Virtuality World",
                        "email": "info@virtualityworld.com.mx"
                    },
                    "to": [
                        {
                            "user_name": clientName,
                            "email": email
                        }
                    ],
                    "subject": "Reserva Confirmada!",
                    "content": messageContent,
                    "org_email": true,
                    "template": {
                        "id": "3801110000045094299"
                    }
                }
            ]
        }

        console.log("emailData: " + JSON.stringify(emailData));
        // Send invoice data to Zoho
    const response = await axios.post('https://www.zohoapis.com/crm/v6/Contacts/3801110000049222092/actions/send_mail', emailData, { headers });

    // Respond with Zoho's API response
    console.log("Resp email " +response.data);
    res.json(response.data);
} catch (error) {
    console.error(error.response ? error.response.data : error);
    res.status(500).json({ message: "Error processing the request" });
}
});

router.post('/cierre', async (req, res) => {
    const { userName,closingAmount,cashAmount,cardAmount,differenceCash,differenceCard } = req.body
    const { lastTokenHour, token } = await updateTokenHour();
    var location = req.body.location || "Tepic Plaza Forum";

    const messageContent = `
    Hola,
    <br><br>
    Cierre de caja de ${userName} en Virtuality World ${location}.
    <br><br>
    Fecha: ${new Date().toLocaleDateString()}
    <br>
    Cantidad de cierre: $${closingAmount}
    <br>
    Cantidad en efectivo: $${cashAmount}
    <br>
    Cantidad en tarjeta: $${cardAmount}
    <br>
    Diferencia en efectivo: $${differenceCash}
    <br>
    Diferencia en tarjeta: $${differenceCard}
    <br><br>
    Saludos cordiales,
    `;


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
                            "user_name": "Virtuality World",
                            "email": "info@virtualityworld.com.mx"
                        },
                            {
                                "user_name": "Virtuality World",
                                "email": "ventas@maxadhoc.com"
                            }
                            ,
                            {
                                "user_name": "Virtuality World",
                                "email": "ricardo.garate@maxadhoc.com"
                            }

                    ],
                    "subject": "Cierre de sesion " + userName + " " + new Date().toLocaleDateString(),
                    "content": messageContent,
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
    console.log("Resp email " +response.data);
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
