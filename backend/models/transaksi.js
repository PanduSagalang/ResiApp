'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaksi extends Model {
    static associate(models) {
      Transaksi.belongsTo(models.Resi, { foreignKey: 'resi_id', as: 'resi' });
    }
  }
  Transaksi.init({
    resi_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    hpp_total: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    harga_jual_total: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    admin_fee: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    ppn: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    potongan_retur: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    penghasilan_kotor: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    penghasilan_bersih: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Transaksi',
    tableName: 'transaksi',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at'
  });
  return Transaksi;
};
