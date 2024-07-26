const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


router.post('/', async (req, res) => {
    console.log(req.body);
    const session_id = req.body.sessionid;
    const amount = req.body.amount;
    const articulos = req.body.articulos;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: req.body.email || 'test@test.com',
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
