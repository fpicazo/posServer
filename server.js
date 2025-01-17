const express = require('express');
require('dotenv').config();
const cors = require('cors');

const connectDB = require('./configuration/db');
const verifyToken = require('./configuration/auth');
const authRoutes = require('./routes/authController');
const transactionRoutes = require('./routes/transactionsRoute');
const reservationRoutes = require('./routes/reservationsRoute');
const clientRoutes = require('./routes/clientsRoutes');
const SesionRoutes = require('./routes/sesionRoutes');
const PaymentRoutes = require('./routes/paymentRoute');
const productRoutes = require('./routes/productsRoute');
const emailRoutes = require('./routes/emailsRoute');
const settingsRoute = require('./routes/settingsRoute');
const folioRoute = require('./routes/folioRoute');
const promocionesRoute = require('./routes/promocionesRoute');
const branchesRoutes = require('./routes/branchesRoutes');
const branchesGetRoutes = require('./routes/branchesRoutes');
const profilesRoutes = require('./routes/profilesRoutes');
const typesRoutes = require('./routes/typesRoutes');

const rooms = require('./routes/roomsRoute');
const roomsGetRoutes = require('./routes/roomsGetRoutes');
const taxtCompanyRoutes = require('./routes/taxtCompanyRoutes');
const customer = require('./routes/customerRoutes');

const saveDataZoho = require('./utils/saveTransactionsZoho');

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());


connectDB();

// Public routes
app.use('/', authRoutes);
app.use('/branchesget', branchesGetRoutes);
app.use('/roomsget', roomsGetRoutes);


// Apply verifyToken middleware globally to all routes coming after this point
// app.use(verifyToken);
app.use('/transactions', transactionRoutes);
app.use('/reservations', reservationRoutes);
app.use('/clients', clientRoutes);
app.use('/sesions', SesionRoutes);
app.use('/payments', PaymentRoutes);
app.use('/products', productRoutes);
app.use('/emails', emailRoutes);
app.post('/saveDataZoho', saveDataZoho);
app.use('/settings', settingsRoute);

app.use('/folio', folioRoute);
app.use('/promociones', promocionesRoute);
app.use('/branches', branchesRoutes);
app.use('/profiles', profilesRoutes);
app.use('/types', typesRoutes);
app.use('/rooms', rooms);
app.use('/taxtCompany', taxtCompanyRoutes);
app.use('/customer', customer);




// name, email
// name2, email2


app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});