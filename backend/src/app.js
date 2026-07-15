const express = require('express');
const sequelize = require('./config/database');

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const tokoRoutes = require('./routes/toko.routes');

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the backend API!',
        status: 'Backend is running successfully',
    });
});

// Routes
app.use('/api/toko', tokoRoutes);

async function startServer() {
    try{
        await sequelize.authenticate();
        console.log('Datanase connection has been established successfully.');
        app.listen(PORT,() => {
            console.log('Server backend is running on port http://localhost:' + PORT);
        });
    }catch (error) {
        console.log('Unable to connect to the database:', error.message);
    process.exit(1);
    }
}

startServer();