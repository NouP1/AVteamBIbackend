const { DataTypes } = require('sequelize');
const sequelize = require('./db.js'); // Путь к вашему экземпляру Sequelize

const UserModel = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'buyer' // Значение по умолчанию для роли
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  // Опции модели
  tableName: 'users', // Название таблицы в базе данных
  timestamps: false // Если не нужно использовать временные метки
});

module.exports = UserModel;