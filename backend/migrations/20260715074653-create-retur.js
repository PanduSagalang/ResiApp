'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('retur', {
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
      alasan: {
        type: Sequelize.TEXT
      },
      tanggal_retur: {
        type: Sequelize.DATEONLY
      },
      jumlah_potongan: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('retur');
  }
};
