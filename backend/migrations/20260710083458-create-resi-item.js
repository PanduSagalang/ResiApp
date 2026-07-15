'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resi_item', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      resi_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      nama_produk: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      variasi: {
        type: Sequelize.STRING(150)
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      produk_master_id: {
        type: Sequelize.INTEGER
      },
    });

  await queryInterface.addConstraint('resi_item',{
    fields:['resi_id'],
    type:'foreign key',
    name:'fk_resi_item_resi',
    references:{
      table:'resi',
      field:'id'
    },
    onUpdate:'CASCADE',
    onDelete:'CASCADE'  
  });
},
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('resi_item');
  }
};