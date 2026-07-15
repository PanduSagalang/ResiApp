'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProdukMaster extends Model {
    static associate(models) {
      ProdukMaster.belongsTo(models.Toko, { foreignKey: 'toko_id', as: 'toko' });
    }
  }
  ProdukMaster.init({
    toko_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nama_produk: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    variasi: {
      type: DataTypes.STRING(150)
    },
    harga_beli: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    harga_jual: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    admin_persen: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    ppn_persen: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'ProdukMaster',
    tableName: 'produk_master',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
  return ProdukMaster;
};
