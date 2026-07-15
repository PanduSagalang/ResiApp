'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Retur extends Model {
    static associate(models) {
      Retur.belongsTo(models.Resi, { foreignKey: 'resi_id', as: 'resi' });
    }
  }
  Retur.init({
    resi_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    alasan: {
      type: DataTypes.TEXT
    },
    tanggal_retur: {
      type: DataTypes.DATEONLY
    },
    jumlah_potongan: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Retur',
    tableName: 'retur',
    timestamps: false
  });
  return Retur;
};
