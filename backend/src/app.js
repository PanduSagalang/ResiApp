const express = require('express');
const sequelize = require('./config/database');

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const tokoRoutes = require('./routes/toko.routes');
const uploadRoutes = require('./routes/upload.routes');
const produkRoutes = require('./routes/produk.routes');
const resiRoutes = require('./routes/resi.routes');
const laporanRoutes = require('./routes/laporan.routes');
const notaRoutes = require('./routes/nota.routes');

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the backend API!',
        status: 'Backend is running successfully',
    });
});

// Routes
app.use('/api/toko', tokoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/produk', produkRoutes);
app.use('/api/resi', resiRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/nota', notaRoutes);

const fs = require('fs');

// Global error handler — prevent silent crashes
process.on('uncaughtException', (err) => {
    const msg = `[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.stack}\n`;
    console.error(msg);
    fs.appendFileSync('crash.log', msg);
});
process.on('unhandledRejection', (reason, promise) => {
    const msg = `[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason.stack || reason}\n`;
    console.error(msg);
    fs.appendFileSync('crash.log', msg);
});

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