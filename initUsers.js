const UserModel = require('./usermodel');
require('dotenv').config();


const initUsers = async () => {
  try {
const admin = process.env.AD;
const buyer1 = process.env.B1;
const buyer2 = process.env.B2;
const buyer3 = process.env.B3;
const buyer4 = process.env.B4;
const buyer5 = process.env.B5;
const buyer6 = process.env.B6;
const buyer7 = process.env.B7;
    // Сброс таблицы (удаление всех записей)
    await UserModel.sync({ force: true });

    // Создание пользователей
    await UserModel.bulkCreate([
      { username: 'admin', password: admin, role: 'admin' },
      { username: 'id3', password: buyer1, role: 'buyer', name: 'Artur' },
      { username: 'buyer2', password: buyer2, role: 'buyer', name: 'Anton' },
      { username: 'id4', password: buyer4, role: 'buyer', name: 'Pasha' },
      { username: 'id5', password: buyer5, role: 'buyer', name: 'Iliya' },
      // { username: 'id6', password: buyer6, role: 'buyer', name: 'Stas' },
      { username: 'id7', password: buyer7, role: 'buyer', name: 'Rustam' },
      
    ]);

    console.log('Пользователи успешно созданы.');
  } catch (error) {
    console.error('Ошибка при создании пользователей:', error);
  }
};

// Запуск скрипта инициализации
module.exports=initUsers;