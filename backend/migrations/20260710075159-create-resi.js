'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resi', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      toko_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'toko',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      no_resi: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      no_pesanan: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      penerima_nama: {
        type: Sequelize.STRING(150),
      },
      penerima_alamat: {
        type: Sequelize.TEXT
      },
      pengirim: {
        type: Sequelize.STRING(150)
      },
      berat: {
        type: Sequelize.DECIMAL(10,2)
      },
      tanggal_pesan: {
        type: Sequelize.DATEONLY
      },
      status: {
        type: Sequelize.ENUM('aktif', 'retur', 'dibatalkan'),
        defaultValue: 'aktif'
      },
      file_asal: {
        type: Sequelize.STRING(255)
      },
      upload_log_id: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  
  await queryInterface.addConstraint('resi',{
    fields:['toko_id', 'no_resi'],
    type: 'unique',
    name:'uniq_resi_per_toko'
  });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('resi');
  }
};