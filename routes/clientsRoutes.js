const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// POST route to add a new note
router.post('/', async (req, res) => {
  try {
    const {phone,firstName,lastName, email, } = req.body;

    const newClient = new Client({
        phone,
        firstName,
        lastName,
        email
        });

        await newClient.save();

    
    res.status(201).json(newClient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding Client" });
  }
});

// GET route to fetch all notes
router.get('/', async (req, res) => {
    try {
        const clients = await Client.find();
        res.json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching Clients" });
    }

});

// PUT route to update a note
router.put('/:id', async (req, res) => {
  const { id } = req.params;
    const { phone, firstName, lastName, email } = req.body;
  try {
    const updatedClient = await Client.findByIdAndUpdate(
        id, 
        { phone, firstName, lastName, email },
        { new: true }
        );

    if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
        }

    res.json(updatedClient);
    } catch (error) {
        res.status(500).json({ message: "Error updating client" });
    }
}
);


// DELETE route to remove a note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByIdAndDelete(id);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting client" });
  }
}
);

module.exports = router;
