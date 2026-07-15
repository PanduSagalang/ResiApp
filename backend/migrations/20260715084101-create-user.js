'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tabel users sudah dibuat manual/sebelumnya — skip agar tidak bentrok
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
