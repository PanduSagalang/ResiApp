'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Toko extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Toko milik 1 User (opsional)
      Toko.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });

      // 1 Toko punya banyak Resi
      Toko.hasMany(models.Resi, {
        foreignKey: 'toko_id',
        as: 'resi_list'
      });
      // 1 Toko punya banyak ProdukMaster
      Toko.hasMany(models.ProdukMaster, {
        foreignKey: 'toko_id',
        as: 'produk_master_list'
      });
      // 1 Toko punya banyak UploadLog
      Toko.hasMany(models.UploadLog, {
        foreignKey: 'toko_id',
        as: 'upload_logs'
      });
    }
  }
  Toko.init({
    id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    nama_toko:{
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Toko',
    tableName: 'toko',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  });
  return Toko;
};