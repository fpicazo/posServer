const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Reservation = require('../models/Reservation');
const ReservationCourse = require('../models/reservationCourseModel')
const Branches = require('../models/branchesModel');
const stripe = require('stripe')(process.env.STRIPE_SECR_LIVE);
const stripeSuc = require('stripe');
const axios = require('axios');

  router.post('/', async (req, res) => {
    const session_id = req.body.sessionid;
    const amount = req.body.amount;
    const articulos = req.body.articulos;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      allow_promotion_codes:true,
      line_items: [{
        price_data: { 
          currency: 'mxn',
          product_data: { 
            name: articulos, 
          },
          unit_amount: amount * 100,  
        },
        quantity: 1, 
      }],
      metadata: {
        orderId: session_id.toString(),
      },
      mode: 'payment',
      success_url:  process.env.BASE_URL + "/#/success?session_id=" + session_id,
      cancel_url: process.env.BASE_URL + '/#/cancel?session_id=' + session_id,
    });
    // await Reservation.findOneAndUpdate( { _id: session_id }, { idSessionStripe: session.id });
    res.json({ id: session.id, url: session.url }); 
  });


  router.get('/stripe_session', async (req, res) => {
    const idsession = req.query.session_id;
    const bucqueda = await Reservation.findById(idsession);

    const session = await stripe.checkout.sessions.retrieve(bucqueda.idSessionStripe, {
      expand: ['total_details.breakdown']
    });
    const amount_total = session.amount_subtotal;
    const amount_final = session.amount_total;
    const descuento = parseFloat(((1 - (amount_final / amount_total))*100 ).toFixed(2));
    const couponName = session.total_details?.breakdown?.discounts?.[0]?.discount?.coupon?.name;
    const json = { amount_total, amount_final, descuento, couponName };
    res.json(json);
  }
  );


  router.get('/payment-intent', async (req, res) => {
    const { idpayment } = req.query;

    const paymentIntent = await stripe.paymentIntents.retrieve(idpayment);
    res.json(paymentIntent); 
  }
  );

  
  const getStripeInstance = async( _id ) => {

    let stripeSecretKey = ''
    if( _id === '6735e8fe3cbf3096493afa5e' ){
      stripeSecretKey = process.env.STRIPE_SECRET_PRUEBA_PUVA;
    }else if( _id === '6767682b3b3a0a728a7025f6' ){
      stripeSecretKey = process.env.STRIPE_SECRET_PRUEBA_GUA;
    }else if( _id === '6777d2ef04406efc1a932db9' ){
      stripeSecretKey = process.env.STRIPE_SECRET_PRUEBA_MAR;
    }

    return stripeSuc(stripeSecretKey);

  };


  router.post('/curso', async (req, res) => {
    try{

      const { idBrance, articulo, amount, reservation } = req.body;

      // console.log(JSON.stringify(reservation));
      

      const reservationCourse = ReservationCourse({
        players: reservation.players,
        date: convertToLocalTime(reservation.date),
        course: reservation.course,
        location: reservation.location,
        startDate: convertToLocalTime(reservation.startDate),
        endDate: convertToLocalTime(reservation.endDate),
        client: reservation.client,
        contactPhone: reservation.contactPhone,
        contactEmail: reservation.contactEmail,
        contactName: reservation.contactName,
        status: reservation.status
      });
      const savedReservation = await reservationCourse.save();

      const branche = await Branches.findById(idBrance);
      const stripeSucFinal = await getStripeInstance( branche._id.toString() );
      const session = await stripeSucFinal.checkout.sessions.create({
        payment_method_types: ['card'],
        allow_promotion_codes:true,
        line_items: [{
          price_data: { 
            currency: 'mxn',
            product_data: { 
              name: articulo, 
            },
            unit_amount: amount * 100
          },
          quantity: 1, 
        }],
        metadata: {
          orderId: savedReservation._id.toString(),
        },
        mode: 'payment',
        success_url:  process.env.BASE_URL + "/success/" + savedReservation._id.toString()
        // cancel_url: process.env.BASE_URL + '/#/cancel?session_id=' + orderId,
      });

      
      // console.log({ id: session.id, url: session.url });
      res.json({ url: session.url });

    }
    catch( error ){
      console.error(error);
    }

  });

  
  const convertToLocalTime = (date) => {
    const localDate = new Date(date);
    const offset = localDate.getTimezoneOffset() * 60000; // Obtener el offset en milisegundos
    return new Date(localDate.getTime() - offset); // Convertir a la zona horaria local
  };



  const refresh_token_crm = async() => {
  
    const consumirRefreshToken = axios.create({ baseURL: 'https://accounts.zoho.com/oauth/v2/' });
    const respTR = await consumirRefreshToken.post('token?refresh_token=1000.e958b827d0ce27b405e47c5f8270a1b7.7bd3c073cddf5cf64f4b42d706e3f7e9&client_secret=7fbac496235d6d7d0b2190b02a304b4d58333c5a5f&client_id=1000.BG9KKAI44A9SWT4ODN80AF4YRTDL8I&grant_type=refresh_token');
    const epochTimeInSeconds = Math.floor(Date.now() / 1000);
    const exp = epochTimeInSeconds + respTR.data.expires_in;
    const strList = respTR.data.access_token.split('.');
    return{
      tkr: `${exp}.${strList[1]}.${strList[2]}.${strList[0]}`
    }
  
  };


  const order_data = ( tkr ) => {

    const strList = tkr.split('.');
    return `${strList[3]}.${strList[1]}.${strList[2]}`;
  
  };


  router.post('/registro', async (req, res) => {
    try
    {

      const 
      { 
        idBrance, razonSocial, rfc, estado, codigoPostal, plan, nombre, correoElectronico,
        telefono, maximo, costo
      } = req.body;

      const tkr = await refresh_token_crm();
      const tk = order_data( tkr.tkr );
      
      const consumir = axios.create({ baseURL: 'https://www.zohoapis.com/crm/v2.1/', headers: { 'Authorization': `Zoho-oauthtoken ${tk}` } });
      
      let totalRecords = 0;
      let allRecords = []; 
      let page = 1;
      let moreRecords = true;
      while(moreRecords){
          try {

              const respCM = await consumir.get(`Accounts?per_page=200&page=${page}`);
              const data = respCM.data;

              if (data.data) {
                  allRecords = [...allRecords, ...data.data]; // Agregar nuevos registros sin duplicados
                  totalRecords += data.data.length;
              }

              moreRecords = data.info?.more_records || false;
              page++;

          } catch (error) {
              console.error("Error al obtener registros:", error.response?.data || error.message);
              break;
          }
      }

      const fecha = new Date(Date.now());
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const dia = String(fecha.getDate()).padStart(2, "0");
      const formato = `${año}-${mes}-${dia}`;

      const result = allRecords.filter( x => x.RFC_o_CUIT === rfc );
      if( result.length > 0 ){
        
        return res.json({ banderuaUrl: false, url: '' });

      }else{
        
        const respAcco = await consumir.post(`Accounts`, {
          "data": [
              {
                "Account_Name": razonSocial.toUpperCase(),
                "Phone": telefono,
                
                "Factura_Autom_tica": true,
                "Raz_n_Social": razonSocial.toUpperCase(),
                "RFC_o_CUIT": rfc.toUpperCase(),
                "Billing_Code": codigoPostal,
                "Correo_electr_nico": correoElectronico,
                "Pais_de_Facturaci_n": "Mexico",
                "Unidad": "VirtualityWorld",
                "Monto_Membresia": costo,
                "Estatus_Capacitacion_Maxaahoc": "Pendiente",
                "Membresia": `Suscripción Mensual ${plan}`,
                "Layout": {
                  "id": "3801110000056376407"  // ID del Layout
                },
                "Fecha_registro_VitualityWorld": formato
              }
          ]

        });

        const id_zoho = respAcco.data.data[0].details.id;

        const stripeSucFinal = await getStripeInstance(idBrance);

        // -- 1️ -- Verificar si ya existe el tax_rate (impuesto del 16%)
        let taxRateId;
        const existingTaxRates = await stripeSucFinal.taxRates.list({
            limit: 100,
        });
        const existingTaxRate = existingTaxRates.data.find(tax => tax.display_name === 'IVA 16%' && tax.percentage === 16.0);
        if (existingTaxRate) {
            taxRateId = existingTaxRate.id;
            console.log("El impuesto ya existe. Usando el ID:", taxRateId);
        } else {
            const newTaxRate = await stripeSucFinal.taxRates.create({
                display_name: 'IVA 16%',
                description: 'Impuesto sobre el valor agregado del 16%',
                percentage: 16.0,
                inclusive: false,
                country: 'MX'
            });
            taxRateId = newTaxRate.id;
            console.log("Nuevo impuesto creado:", taxRateId);
        }


        // -- 2 -- Obtener los precios existentes o crear uno nuevo
        let priceId;
        const pricesExistentes = await stripeSucFinal.prices.list({
            limit: 100,
        });
        for (let price of pricesExistentes.data) {
            const product = await stripeSucFinal.products.retrieve(price.product);
            if (product.name === `Suscripción Mensual ${plan}` && price.unit_amount === costo * 100 && price.currency === 'mxn') {
                priceId = price.id;
                console.log("Precio ya existe:", priceId);
                break;
            }
        }
        if (!priceId) {
            const price = await stripeSucFinal.prices.create({
                unit_amount: costo * 100,
                currency: 'mxn',
                recurring: { interval: 'month' },
                product_data: { name: `Suscripción Mensual ${plan}` },
            });

            priceId = price.id;
            console.log("Precio creado:", priceId);
        }


        // -- 3 -- Verificar si el cliente ya existe
        const { data: clientesExistentes } = await stripeSucFinal.customers.list({ email: correoElectronico, limit: 1 });
        let customerId;
        if (clientesExistentes.length > 0) {
            customerId = clientesExistentes[0].id;
            console.log("Cliente ya existe:", customerId);
        } else {
            const nuevoCliente = await stripeSucFinal.customers.create({
                name: nombre,
                email: correoElectronico,
                phone: telefono
            });

            customerId = nuevoCliente.id;
            console.log("Nuevo cliente creado:", customerId);
        }


        // -- 4 -- Buscar suscripción activa para el cliente
        let subscriptionId;
        const { data: suscripcionesExistentes } = await stripeSucFinal.subscriptions.list({
            customer: customerId,
            limit: 1
        });
        let tieneImpuesto = false;
        if (suscripcionesExistentes.length > 0) {
            const subscription = suscripcionesExistentes[0];
            const taxRatesAplicados = subscription.items.data[0].tax_rates || [];
            tieneImpuesto = taxRatesAplicados.some(tax => tax.id === taxRateId);
            subscriptionId = subscription.id;
            console.log(tieneImpuesto ? " El impuesto ya está aplicado." : "El impuesto NO está aplicado.");
        }


        // -- 5 -- Si la suscripción no tiene el impuesto, agregarlo
        if (!tieneImpuesto) {
            const subscription = await stripeSucFinal.subscriptions.create({
                customer: customerId,
                items: [{
                    price: priceId,
                    tax_rates: [taxRateId], // Aplicar el impuesto solo si no está aplicado
                }],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent'],
            });

            subscriptionId = subscription.id;
            console.log("Suscripción creada con impuesto:", subscriptionId);
        } else {
            console.log("No se crea ni actualiza la suscripción, el impuesto ya está aplicado.");
        }


        // -- 6 -- Crear la sesión de pago con success_url y cancel_url
        const session = await stripeSucFinal.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                    tax_rates: [taxRateId]
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.BASE_URL_CURSOS}/success_curso/${id_zoho}/${tk}`
        });

        res.json({ banderuaUrl: true, url: session.url });

      }
      
    }
    catch( error ){
      console.error(error);
    }

  });


  router.get('/registro_actualizar/:id/:tk', async (req, res) => {
    try
    {

      const { id, tk } = req.params;

      console.log( id, tk );

      const consumir = axios.create({ baseURL: 'https://www.zohoapis.com/crm/v2.1/', headers: { 'Authorization': `Zoho-oauthtoken ${tk}` } });
      
      const respAcco = await consumir.put(`Accounts/${id}`, {
        "data": [
            {
              "Estatus_Capacitacion_Maxaahoc": "Activo",
              "Layout": {
                "id": "3801110000056376407"  // ID del Layout
              }
            }
        ]

      });

      return res.json({ mensaje: 'ok' });
      
    }
    catch( error ){
      console.error(error);
    }

  });
  


module.exports = router;




    // const session_id = req.body.sessionid;
    // const amount = req.body.amount;
    // const articulos = req.body.articulos;
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   allow_promotion_codes:true,
    //   line_items: [{
    //     price_data: { 
    //       currency: 'mxn',
    //       product_data: { 
    //         name: articulos, 
    //       },
    //       unit_amount: amount * 100,  
    //     },
    //     quantity: 1, 
    //   }],
    //   metadata: {
    //     orderId: session_id.toString(),
    //   },
    //   mode: 'payment',
    //   success_url:  process.env.BASE_URL + "/#/success?session_id=" + session_id,
    //   cancel_url: process.env.BASE_URL + '/#/cancel?session_id=' + session_id,
    // });
    // await Reservation.findOneAndUpdate( { _id: session_id }, { idSessionStripe: session.id });
    // res.json({ id: session.id, url: session.url });