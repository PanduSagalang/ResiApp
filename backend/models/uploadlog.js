'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UploadLog extends Model {
    static associate(models) {
      UploadLog.belongsTo(models.Toko, { foreignKey: 'toko_id', as: 'toko' });
    }
  }
  UploadLog.init({
    toko_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nama_file: {
      type: DataTypes.STRING(255)
    },
    jumlah_resi: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    file_dihapus_pada: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UploadLog',
    tableName: 'upload_log',
    timestamps: true,
    createdAt: 'uploaded_at',
    updatedAt: false
  });
  return UploadLog;
};
