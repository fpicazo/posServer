const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const stripe = require('stripe')("sk_test_51HDAAcJLoV4LkDEzerLRhPyxwKwVB49Ik9qUnHU3Hdf698pdD0Xj5YCeUaXEIVk38iVLRS3UgTbePpiHNj2L1Cdb00oRfs8j9i");


router.post('/', async (req, res) => {
    console.log(req.body);
    const session_id = req.body.sessionid;
    const amount = req.body.amount;
    const articulos = req.body.articulos;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
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
    console.log(session);
    res.json({ id: session.id }); 
  });


module.exports = router;
