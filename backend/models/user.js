'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // 1 User bisa punya banyak Toko (multi-user scenario)
      User.hasMany(models.Toko, {
        foreignKey: 'user_id',
        as: 'tokos'
      });
    }
  }
  User.init({
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
  });
  return User;
};
