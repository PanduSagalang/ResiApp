'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('produk_master', {
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
      nama_produk: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      variasi: {
        type: Sequelize.STRING(150)
      },
      harga_beli: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      harga_jual: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      admin_persen: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      ppn_persen: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addConstraint('produk_master', {
      fields: ['toko_id', 'nama_produk', 'variasi'],
      type: 'unique',
      name: 'uniq_produk_toko'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('produk_master');
  }
};
