// authController.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/Users');
require('dotenv').config();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "email and password are required" });
    }
    
    try {
        const user = await User.findOne({ email });
        //console.log("User found " + user);
        if (!user) {
            return res.status(401).json({ message: "Authentication failed" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Authentication failed" });
        }

        const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: '48h' });
        console.log("Token created " + token);
        return res.status(200).json({ token,role: user.role,id: user._id,firstName: user.firstName,lastName: user.lastName});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
);

router.post('/register', async (req, res) => {
  console.log(req.body);
    try {
      const { email, password, role,offices,firstName,lastName,phone } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "nombre, apellido y contraseña son obligatorio" });
      }
  
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Existe un user con ese email" });
      }

      if( role == null){
        const role = "Admin";
      }
      // Create and save the user
      const user = new User({ email, password, role,offices,firstName,lastName,phone});
      
      const userCreation = await user.save();
      console.log("User created " + userCreation);

      const token = jwt.sign({ email: user.email }, process.env.SECRET_KEY, { expiresIn: '24h' });
      // Respond with success (don't send back the password or sensitive info)
      return res.status(201).json({ message: "User created successfully", token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get('/users', async (req, res) => {
    try {
      const users = await User.find();
      return res.json(users);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.delete('/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);

      res.json({"Message": "User deleted successfully"});
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  );


  module.exports = router;
