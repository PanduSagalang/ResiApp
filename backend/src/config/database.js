require('dotenv').config();

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
{
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
}
);

async function testConnection() {
    try{
        await sequelize.authenticate();
        console.log('Koneksi database berhasil');
    }catch(error){
        console.error('Koneksi database gagal', error.message);
    }
}

testConnection();

module.exports = sequelize;