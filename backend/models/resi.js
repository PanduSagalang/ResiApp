'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Resi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Resi milik 1 Toko
      Resi.belongsTo(models.Toko, { foreignKey: 'toko_id', as: 'toko' });
      
      // 1 Resi punya banyak ResiItem (produk)
      Resi.hasMany(models.ResiItem, {
        foreignKey: 'resi_id',
        as: 'items'
      });

      // 1 Resi punya 1 Transaksi
      Resi.hasOne(models.Transaksi, {
        foreignKey: 'resi_id',
        as: 'transaksi'
      });

      // 1 Resi punya 1 Retur (jika ada)
      Resi.hasOne(models.Retur, {
        foreignKey: 'resi_id',
        as: 'retur'
      });
    }
  }
  Resi.init({
    toko_id:{

    type: DataTypes.INTEGER,
    allowNull: false
    },
    no_resi:{
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    no_pesanan:{
      type:DataTypes.STRING(100),
      allowNull: false,
    },
    penerima_nama: DataTypes.STRING(150),
    penerima_alamat: DataTypes.TEXT,
    pengirim: DataTypes.STRING(150),
    berat: DataTypes.DECIMAL(10, 2),
    tanggal_pesan: DataTypes.DATEONLY,
    status: {
      type: DataTypes.ENUM('aktif', 'retur', 'dibatalkan'),
      defaultValue: 'aktif',
    },
    file_asal: DataTypes.STRING(255),
    upload_log_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Resi',
    tableName: 'resi',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Resi;
};