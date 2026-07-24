'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ResiItem extends Model {
    static associate(models) {
      ResiItem.belongsTo(models.Resi, {
        foreignKey: 'resi_id',
        as: 'resi'
      });
      ResiItem.belongsTo(models.ProdukMaster, {
        foreignKey: 'produk_master_id',
        as: 'produk_master'
      });
    }
  }
  ResiItem.init({
    resi_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nama_produk: {
      type: DataTypes.STRING(250),
      allowNull: false
    },
    variasi: DataTypes.STRING(150),
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    produk_master_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ResiItem',
    tableName: 'resi_item',
    timestamps: false
  });
  return ResiItem;
};
