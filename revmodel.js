const sequelize = require('./db.js');
const { DataTypes } = require('sequelize');
const BuyerModel = require('./buyersmodel.js');

const RevenueRecord = sequelize.define('revenue_records', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true,
    autoIncrement: true
  },
  buyerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BuyerModel,
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY, // Хранит только дату без времени
    allowNull: false,
  },
  income: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  expenses: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  profit: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  }
});

// Устанавливаем связь между моделями
BuyerModel.hasMany(RevenueRecord, { foreignKey: 'buyerId' });
RevenueRecord.belongsTo(BuyerModel, { foreignKey: 'buyerId' });

module.exports = RevenueRecord;