const sequelize  = require ('./db.js')
const {DataTypes}  = require('sequelize');

const BuyerModel = sequelize.define(
  'buyers',
  {
    id: { 
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    nameBuyer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
     countRevenue: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
     
    },
    countFirstdeps: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    


});
module.exports = BuyerModel;