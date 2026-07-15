'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ResiItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ResiItem.belongsTo(models.Resi,{
      foreignKey:'resi_id',
      as:'resi',
      // define association here
    });
  }
}
  ResiItem.init({
    resi_id: {
      type: DataTypes.INTEGER,
      allowNull:false
  }, 
  nama_produk:{
    type: DataTypes.STRING(250),
    allowNull:false
  },
  variasi: DataTypes.STRING(150),
  qty:{
    type: DataTypes.INTEGER,
    allowNull:false,
    defaultValue:1
  },
  produk_master_id:DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ResiItem',
    tableName: 'resi_item',
    timestamps: true
  });
  return ResiItem;
};