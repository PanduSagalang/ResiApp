'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Resi extends Model {
    static associate(models) {
      Resi.belongsTo(models.Toko, { foreignKey: 'toko_id', as: 'toko' });
      Resi.hasMany(models.ResiItem, { foreignKey: 'resi_id', as: 'items' });
      Resi.hasOne(models.Transaksi, { foreignKey: 'resi_id', as: 'transaksi' });
      Resi.hasOne(models.Retur, { foreignKey: 'resi_id', as: 'retur' });
      Resi.belongsTo(models.UploadLog, { foreignKey: 'upload_log_id', as: 'upload_log' });
    }
  }
  Resi.init({
    toko_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    no_resi: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    no_pesanan: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    penerima_nama: DataTypes.STRING(150),
    penerima_alamat: DataTypes.TEXT,
    pengirim: DataTypes.STRING(150),
    berat: DataTypes.DECIMAL(10,2),
    tanggal_pesan: DataTypes.DATEONLY,
    status: {
      type: DataTypes.ENUM('aktif','retur','dibatalkan'),
      defaultValue: 'aktif'
    },
    file_asal: DataTypes.STRING(255),
    upload_log_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Resi',
    tableName: 'resi',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  return Resi;
};