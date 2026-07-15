'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('upload_log', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      toko_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'toko', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nama_file: {
        type: Sequelize.STRING(255)
      },
      jumlah_resi: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      uploaded_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      file_dihapus_pada: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('upload_log');
  }
};
