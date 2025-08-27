const express = require('express');
const router = express.Router();
const { updateTokenHour } = require('../utils/checkAndRefreshToken');
const axios = require('axios');
const moment = require('moment-timezone');
const Timezone = "America/Hermosillo";


const Users = require('../models/Users');
const Profiles = require('../models/profilesModel');
const Branches = require('../models/branchesModel');


router.post('/confirmation', async (req, res) => {
  const { email, clientName, date, game, players } = req.body;
  console.log("email: " + email);

  // ====== CONFIG DE SUCURSALES ======
  const LOCATIONS = {
    "Tepic Plaza Forum": {
      label: "Tepic Plaza Forum",
      address: "Blvrd. Luis Donaldo Colosio 680, Benito Juárez Oriente, 63175 Tepic, Nay. - PLAZA FORUM TEPIC.",
      directions: "Estamos ubicados en el segundo nivel a un lado de Cinemex en Plaza Forum Tepic.",
      parkEmail: "tepic@virtualityworld.com.mx"
    },
    "Nuevo Casas Grandes": {
      label: "Nuevo Casas Grandes",
      address: "Lib. Luis R. Blanco 601, Obrera, 31750 Nuevo Casas Grandes, Chih., México - PLAZA NOGALES NUEVO CASAS GRANDES CHIHUAHUA.",
      directions: "Estamos ubicados al frente de la Plaza Nogales en Nuevo Casas Grandes Chihuahua.",
      parkEmail: "nuevocasasgrandes@virtualityworld.com.mx"
    },
    "Puerto Vallarta": {
      label: "Puerto Vallarta",
      address: "Blvd. Francisco Medina Ascencio 2479, PB-71, Zona Hotelera, Las Glorias, 48333 Puerto Vallarta, Jal., México - PLAZA LA ISLA.",
      directions: "Estamos ubicados al lado del anfiteatro por las escaleras eléctricas de Cinépolis en Plaza La Isla.",
      parkEmail: "puertovallarta@virtualityworld.com.mx"
    },
    "Guadalajara": {
      label: "Guadalajara",
      address: "Av Rafael Sanzio 150, R-01, Camichines Vallarta, 45020 Zapopan, Jal., México - PLAZA GALERIAS.",
      directions: "Estamos ubicados en el tercer piso por el lado de Liverpool, arriba de Italianni's en Plaza Galerías.",
      parkEmail: "guadalajara@virtualityworld.com.mx"
    },
    "Monterrey": {
      label: "Monterrey",
      address: "Av Lázaro Cárdenas 1000, Valle del Mirador, 64750 Monterrey, N.L., México - PLAZA GALERIAS VALLE ORIENTE.",
      directions: "Estamos ubicados en el tercer piso por el lado de Soriana, al lado del Starbucks a 50 metros del acuario Sealand en Plaza Galerías Valle Oriente.",
      parkEmail: "monterrey@virtualityworld.com.mx"
    }
  };

  // Normaliza cadenas tipo "Tepic", "Plaza La Isla", etc. a una clave canónica
  const normalizeLocation = (raw) => {
    const v = String(raw || "").toLowerCase();
    if (v.includes("casas") || v.includes("nogales")) return "Nuevo Casas Grandes";
    if (v.includes("vallarta") || v.includes("isla")) return "Puerto Vallarta";
    if (v.includes("guadal")) return "Guadalajara";
    if (v.includes("monter")) return "Monterrey";
    return "Tepic Plaza Forum";
  };

  // Toma la ubicación del body o usa Tepic como default
  const rawLocation = req.body.location || "Tepic Plaza Forum";
  const key = normalizeLocation(rawLocation);
  const loc = LOCATIONS[key];

  const { lastTokenHour, token } = await updateTokenHour();

  // ====== CONTENIDO DEL CORREO (HTML) ======
  const messageContent = `
    Hola ${clientName},<br><br>
    ¡Gracias por reservar en Virtuality World ${loc.label}. Tu recibo de reserva está abajo.<br><br>
    Recomendamos encarecidamente a los huéspedes que lleguen 10-15 minutos antes de la hora de inicio de su reserva. 
    Tenemos una estricta política de período de gracia de 5 minutos para tu reserva. 
    Debido a la alta demanda, cualquier retraso superior a 5 minutos podría resultar en la cancelación de tu reserva 
    para asegurar que las citas de nuestros otros huéspedes no se vean afectadas.<br>
    Usa ropa ligera y cómoda para que puedas moverte libre y cómodamente.<br><br>

    <strong>LUGAR:</strong><br>
    Dirección: ${loc.address}<br><br>

    <strong>Detalles:</strong><br>
    Juego: ${game}, Horario: ${date} con ${players} jugadores.<br>
    ${loc.directions}<br><br>

    <strong>POLÍTICA DE CANCELACIÓN:</strong> Debido a las reservas limitadas, solicitamos que canceles al menos 72 horas antes de tu reserva programada.<br><br>

    Si cancelas al menos 72 horas antes de tu reserva, se emitirá un reembolso completo al método de pago original o se aplicará a un vale para una futura reserva.<br>
    Si cancelas entre 24-72 horas, se te cobrará una tarifa de $500 pesos y el saldo de tu pago se aplicará a un vale para una futura reserva.<br>
    Las cancelaciones o reprogramaciones realizadas en menos de 24 horas <strong>NO SERÁN REEMBOLSADAS</strong>.<br><br>

    Todos los huéspedes que no se presenten incurrirán en la cancelación automática de la reserva y no se emitirá ningún reembolso.<br><br>

    Saludos cordiales,<br>
    Virtuality World - ${loc.label}
  `;

  try {
    const headers = {
      Authorization: `Zoho-oauthtoken ${token}`
    };

    const emailData = {
      data: [
        {
          from: {
            user_name: "Virtuality World",
            email: "info@virtualityworld.com.mx"
          },
          to: [
            {
              user_name: clientName,
              email: email
            }
          ],
          // Si prefieres CC visible al cliente, reemplaza "bcc" por "cc" aquí:
          bcc: [
            {
              user_name: `Virtuality World - ${loc.label}`,
              email: loc.parkEmail
            }
          ],
          subject: `Reserva Confirmada – ${loc.label}`,
          content: messageContent,
          org_email: true,
          // mail_format ayuda a forzar HTML en algunos escenarios
          mail_format: "html",
          template: {
            id: "3801110000045094299"
          }
        }
      ]
    };

    // console.dir(emailData, { depth: null });
    const response = await axios.post(
      "https://www.zohoapis.com/crm/v6/Contacts/3801110000049222092/actions/send_mail",
      emailData,
      { headers }
    );

    console.log("Resp email:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error);
    res.status(500).json({ message: "Error processing the request" });
  }
});



router.post('/cierre', async (req, res) => {
    const { userName,closingAmount,cashAmount,cardAmount,differenceCash,differenceCard, profile } = req.body
    const { lastTokenHour, token } = await updateTokenHour();
    var location = req.body.location || "Tepic Plaza Forum";

    const messageContent = `
    Hola,
    <br><br>
    Cierre de caja de ${userName} en Virtuality World - (${profile}).
    <br><br>
    Fecha: ${moment.tz(Timezone).format('DD/MM/YYYY')}
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
                            },
                            {
                                "user_name": "Ventas MaxAdhoc",
                                "email": "ventas@maxadhoc.com"
                            }  

                    ],
                    "subject": "Cierre de sesion " + userName + " " + moment.tz(Timezone).format('DD/MM/YYYY'),
                    "content": messageContent,
                    "org_email": true,
                    "template": {
                        "id": "3801110000045094299"
                    }
                }
            ]
        }

    // Send invoice data to Zoho
    console.log(emailData);
    // res.json({});
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


router.post('/reservation', async (req, res) => {
  try {
    const { clientName, date, horario, players, amount, game } = req.body;
    console.log(req.body);

    // ====== MAPA DE SUCURSALES ======
    const LOCATIONS = {
      "Tepic Plaza Forum": {
        label: "Tepic Plaza Forum",
        parkEmail: "tepic@virtualityworld.com.mx"
      },
      "Nuevo Casas Grandes": {
        label: "Nuevo Casas Grandes",
        parkEmail: "nuevocasasgrandes@virtualityworld.com.mx"
      },
      "Puerto Vallarta": {
        label: "Puerto Vallarta",
        parkEmail: "puertovallarta@virtualityworld.com.mx"
      },
      "Guadalajara": {
        label: "Guadalajara",
        parkEmail: "guadalajara@virtualityworld.com.mx"
      },
      "Monterrey": {
        label: "Monterrey",
        parkEmail: "monterrey@virtualityworld.com.mx"
      }
    };

    // Normaliza valores como "La Isla", "Guadalajara", "Nogales", etc.
    const normalizeLocation = (raw) => {
      const v = String(raw || "").toLowerCase();
      if (v.includes("casas") || v.includes("nogales")) return "Nuevo Casas Grandes";
      if (v.includes("vallarta") || v.includes("isla")) return "Puerto Vallarta";
      if (v.includes("guadal")) return "Guadalajara";
      if (v.includes("monter")) return "Monterrey";
      return "Tepic Plaza Forum";
    };

    const rawLocation = req.body.location || "Tepic Plaza Forum";
    const locKey = normalizeLocation(rawLocation);
    const loc = LOCATIONS[locKey];

    const { lastTokenHour, token } = await updateTokenHour();

    // ====== CONTENIDO DEL CORREO ======
    const messageContent = `
      Hola,
      <br><br>
      Nueva reserva de <strong>${clientName}</strong> en <strong>Virtuality World ${loc.label}</strong>.
      <br><br>
      Fecha: ${date} ${horario}
      <br>
      Monto Pagado: $${amount}
      <br>
      Jugadores: ${players}
      <br>
      Mapa: ${game}
      <br><br>
      Saludos cordiales,
    `;

    const headers = {
      Authorization: `Zoho-oauthtoken ${token}`
    };

    // Receptor dinámico según la sucursal
    const toRecipients = [
      {
        user_name: `Virtuality World - ${loc.label}`,
        email: "flavienpicazo@gmail.com" // loc.parkEmail
      }
    ];

    // Si quieres copias internas fijas, puedes agregar CC/BCC aquí:
    // const cc = [{ user_name: 'Operaciones', email: 'operaciones@virtualityworld.com.mx' }];
    // const bcc = [{ user_name: 'Flavien', email: 'flavienpicazo@gmail.com' }];

    const subjectDate = moment.tz(date, Timezone).format('DD/MM/YYYY'); // asumiendo que Timezone está definido en tu app




    const emailData = {
      data: [
        {
          from: {
            user_name: "Virtuality World",
            email: "info@virtualityworld.com.mx"
          },
          to: toRecipients,
          // cc, // <- descomenta si agregas arriba
          // bcc, // <- descomenta si agregas arriba
          subject: `Nueva reserva – ${loc.label} – ${clientName} – ${date} ${horario}`,
          content: messageContent,
          org_email: true,
          mail_format: "html",
          template: {
            id: "3801110000045094299"
          }
        }
      ]
    };
    const response = await axios.post(
      'https://www.zohoapis.com/crm/v6/Contacts/3801110000049222092/actions/send_mail',
      emailData,
      { headers }
    );

    console.log("Resp email", response.data);
    res.json(response.data);

  } catch (error) {
    console.error(error.response ? error.response.data : error);
    res.status(500).json({ message: "Error processing the request" });
  }
});



router.get('/user_type/:id', async(req, res) => {

    try{
        
        const { id } = req.params;
        const users = await Users.findById(id);

        const nameUser = `${users.firstName} ${users.lastName}`;

        if( users.perfil === '' ){
            res.status(200).json({ nameUser, profile: 'ADMIN' });
        }else{
            const profile = await Profiles.findById(users.perfil);
            if( profile.tipoUsuario === 'gerente' ){
                res.status(200).json({ nameUser, profile: profile.nombrePerfil.toLocaleUpperCase() });
            }else{

                const branches = await Branches.findById(profile.sucursal);
                res.status(200).json({ nameUser, profile: branches.nameBranches.toLocaleUpperCase() });
            }
        }

        

    } catch (error) {
        console.error(error.response ? error.response.data : error);
        // res.status(500).json({ message: "Error processing the request" });
        res.status(500).json({ nameUser: '--', profile: '--' });
    }

});

module.exports = router;
