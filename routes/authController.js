// authController.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const axios = require('axios');
const User = require('../models/Users');
const Profiles = require('../models/profilesModel');
const Branches = require('../models/branchesModel');
require('dotenv').config();





router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log( req.body );
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
        let perfil = [];
        if( user.perfil !== '' ){
          perfil = await Profiles.findOne({ _id: user.perfil });
        }

        let lng = 'es';
        // console.log( '=========================', perfil.sucursal );
        if( perfil.sucursal !== undefined && Array.isArray(perfil.sucursal) ){
          console.log( ' -- aca ---------------' );
          let branches = await Branches.findById(perfil.sucursal);
          lng = branches.currency;
        }
        console.log( '---------------------------------------------------------------------' )
        console.log( ' perfil ', perfil )
        return res.status(200).json(
                                      { token,
                                        role: user.role,
                                        id: user._id,
                                        firstName: user.firstName,
                                        lastName: user.lastName,
                                        sucursal: user.perfil !== '' ? perfil.sucursal : '',
                                        lng: lng,
                                        perfil: user.perfil
                                      }
                                    );
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
);


router.post('/register', async (req, res) => {
console.log(req.body);
  try {
    const { email, password, role,offices,firstName,lastName,phone, products, sucursal, perfil } = req.body;
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
    const user = new User({ email, password, role,offices,firstName,lastName,phone, products, sucursal, perfil});
    
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


router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.find({ _id: id });
    res.json( { data: user[0].role } );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
);


router.get('/users/filter/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usersFind = await User.findById(id);
    let users = [];
    if( usersFind.role === 'admin' ){
      
      users = await User.find();
      return res.json(users);

    }else if( usersFind.role === 'gerente' ){

      const profiles = await Profiles.find({ _id: usersFind.perfil });
      let arraySucursales = [];
      profiles[0].sucursales.map( ( row ) => {
          arraySucursales = [ ...arraySucursales, row._id ];
      } );
      const perfilesFilter = await Profiles.find({ tipoUsuario: 'user', sucursal: { $in: arraySucursales } });
      let arrayPerfiles = [];
      perfilesFilter.map( ( row ) => {
        arrayPerfiles = [ ...arrayPerfiles, row._id ];
      } );
      const usersArray = await User.find({ perfil: { $in: arrayPerfiles } });
      return res.json(usersArray);

    }
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});



// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------


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

}


const find_crm = async( tk, email, pass ) => {

  const consumirCrm = axios.create({ baseURL: 'https://www.zohoapis.com/crm/v2.1/Empresas_Cursos/', headers: { 'Authorization': `Zoho-oauthtoken ${tk}` } });
  const respCRM = await consumirCrm.get(`search?email=${email}`);
  if( respCRM.status === 200 ){

    const record = respCRM.data.data.find( x => x.Clave_Acceso === pass && x.Membres_a_Activa === true );
    return record;

  }else{
    
    return null;

  }

  
  

};


router.post('/loginsala', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
  }
  
  const tkr = await refresh_token_crm();
  const tk = order_data( tkr.tkr );



  try {
      const user = await User.findOne({ email });
      const customer = await find_crm( tk, email, password );

      //console.log("User found " + user);
      if ( !user && !customer ) {
          
        return res.status(401).json({ message: "Authentication failed" });

      }else if( user && !customer ){

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Authentication failed" });
        }
        const token = jwt.sign({ email, id: user._id }, process.env.SECRET_KEY, { expiresIn: '48h' });
        console.log("Token created " + token);
        let perfil = [];
        if( user.perfil !== '' ){
          perfil = await Profiles.findOne({ _id: user.perfil });
        }
        let lng = 'es';
        if( perfil.sucursal !== undefined ){
          let branches = await Branches.findById(perfil.sucursal);
          lng = branches.currency;
        }
        console.log( ' perfil ', perfil )
        return res.status(200).json(
            { token,
              role: user.role,
              id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              sucursal: user.perfil !== '' ? perfil.sucursal : '',
              lng: lng,
              perfil: user.perfil,
              tkr: tkr.tkr,
              customer: {}
            }
          );

      }else if( !user && customer ){

        let lng = 'es';
        const token = jwt.sign({ email, id: customer.id }, process.env.SECRET_KEY, { expiresIn: '48h' });

        const { id, Email, Name, Membres_a_Activa, R_F_C, empleados } = customer;
        const campos = { id, Email, Name, Membres_a_Activa, R_F_C, empleados };

        return res.status(200).json(
          { token,
            role: 'customer',
            id: customer.id,
            firstName: customer.Name,
            lastName: '',
            sucursal: '',
            lng: lng,
            perfil: 'customer',
            tkr: tkr.tkr,
            customer: campos
          }
        );

      }


          
      
    

      
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
  }
}
);`

`

module.exports = router;