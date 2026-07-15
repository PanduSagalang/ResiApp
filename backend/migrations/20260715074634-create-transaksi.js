'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transaksi', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      resi_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'resi', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      hpp_total: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      harga_jual_total: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      admin_fee: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      ppn: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      potongan_retur: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      penghasilan_kotor: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      penghasilan_bersih: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transaksi');
  }
};
