const { Sequelize} = require('sequelize');
module.exports =  new Sequelize({
  dialect: 'sqlite',
  storage: 'CRMbuyers.db',
  // logging: (...msg) => console.log(msg)
});