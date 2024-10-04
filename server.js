const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dayjs = require('dayjs');
const sequelize = require('./db.js');
const BuyerModel = require('./buyersmodel.js');
const RevenueRecord = require('./revmodel.js');
const UserModel = require('./usermodel');
const initUsers = require('./initUsers');
const { google } = require('googleapis');
const axios = require('axios');
const moment = require('moment-timezone')
const sheets = google.sheets('v4');
const { auth } = require('google-auth-library');
const serviceAccount = require('./core-crowbar-433011-c1-79f7407b3e99.json');
const { Console } = require('console');
const { Op } = require('sequelize');
const isBetween = require ('dayjs/plugin/isBetween');

dayjs.extend(isBetween);

require('dotenv').config();



const app = express();
const PORT = 3100;

const apiKey = process.env.GAPI; 
const spreadsheetId = process.env.SPREADSHEETID;


app.use(cors());
app.use(bodyParser.json());

initUsers();
 //Расходы по датам
 async function getBuyerExpenses(buyerName, date) {
  try { 
    const authClient = auth.fromJSON(serviceAccount);
    authClient.scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    await authClient.authorize();

    const sheetsApi = google.sheets({ version: 'v4', auth: authClient });

    // Получаем список всех листов в таблице
    const sheetsMetadata = await sheetsApi.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    const sheets = sheetsMetadata.data.sheets;
    if (!sheets || sheets.length === 0) {
      throw new Error('Не удалось найти листы в таблице.');
    }

    for (const sheet of sheets) {
      const sheetName = sheet.properties.title;

      // Получаем данные из текущего листа
      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A1:W`,  // Обращаемся к диапазону текущего листа
      });

      const rows = response.data.values;

      if (rows && rows.length > 0) {
        const headers = rows[0];
        const buyerIndex = headers.indexOf(buyerName);
        if (buyerIndex === -1) {
          continue;  // Продолжаем поиск на следующем листе, если байер не найден
        }

        const spentAgnIndex = buyerIndex; 
        const spentAccIndex = buyerIndex + 1; 

        // Ищем строку с указанной датой
        const matchingRow = rows.find(row => row[0] === date);
        
        if (matchingRow) {
          const spentAgn = parseFloat(matchingRow[spentAgnIndex]) || 0;
          const spentAcc = parseFloat(matchingRow[spentAccIndex]) || 0;
          const sumSpent = spentAcc + spentAgn;

          return { spentAgn, spentAcc, sumSpent, sheetName };
        }
      }
    }

    // Если ничего не найдено ни в одном листе
    throw new Error(`Данные за дату ${date} не найдены на любом листе.`);

  } catch (error) {
    console.error('Error getting sheet data:', error);
    throw error;  // Перебрасываем ошибку для обработки на более высоком уровне
  }
}
//Суммы расходов байеров
async function getBuyerExpensesTotal(buyerName, startDate, endDate) {
  try {
    const authClient = auth.fromJSON(serviceAccount);
    authClient.scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    await authClient.authorize();

    const sheetsApi = google.sheets({ version: 'v4', auth: authClient });

    // Получаем список всех листов в таблице
    const sheetsMetadata = await sheetsApi.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    const sheets = sheetsMetadata.data.sheets;
    if (!sheets || sheets.length === 0) {
      throw new Error('Не удалось найти листы в таблице.');
    }

    let totalExpenses = { spentAgn: 0, spentAcc: 0, sumSpent: 0 };

    for (const sheet of sheets) {
      const sheetName = sheet.properties.title;

      // Получаем данные из текущего листа
      const response = await sheetsApi.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A1:W`,  // Обращаемся к диапазону текущего листа
      });

      const rows = response.data.values;
   

      if (rows && rows.length > 0) {
        const headers = rows[0]; // Первый ряд содержит имена байеров
        const buyerIndex = headers.indexOf(buyerName);

        if (buyerIndex === -1) {
          continue;  // Продолжаем поиск на следующем листе, если байер не найден
        }

        const spentAgnIndex = buyerIndex; 
        const spentAccIndex = buyerIndex + 1; 

        // Начинаем с четвертой строки, где начинаются данные
        const sheetExpenses = rows.slice(3).reduce((acc, row) => {
          const date = row[0]; // Предполагается, что дата в первом столбце

          // Проверка, что дата находится в заданном диапазоне
          if (date && dayjs(date).isBetween(startDate, endDate, null, '[]')) {
            const spentAgn = parseFloat(row[spentAgnIndex]) || 0;
            const spentAcc = parseFloat(row[spentAccIndex]) || 0;
            acc.spentAgn += spentAgn;
            acc.spentAcc += spentAcc;
            acc.sumSpent += spentAgn + spentAcc;
          }

          return acc;
        }, { spentAgn: 0, spentAcc: 0, sumSpent: 0 });

        // Добавляем расходы с текущего листа к общим расходам
        totalExpenses.spentAgn += sheetExpenses.spentAgn;
        totalExpenses.spentAcc += sheetExpenses.spentAcc;
        totalExpenses.sumSpent += sheetExpenses.sumSpent;
      }
    }

    return totalExpenses;
  } catch (error) {
    console.error('Ошибка при получении данных из таблицы:', error);
    return { spentAgn: 0, spentAcc: 0, sumSpent: 0 };
  }
}

   


app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Пришел запрос на сервере\n${req.body.username}\n${req.body.password}`);

  try {
    const user = await UserModel.findOne({ where: { username, password } });
    
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Неправильный логин или пароль' });
    }
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});


app.get('/api/admin/buyers', async (req, res) => {
  try {
    const adminUser = await UserModel.findOne({ where: { role: 'admin' } });

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Необходимо указать both startDate и endDate.' });
    }

    if (adminUser) {
      const buyers = await BuyerModel.findAll({
        order: [['nameBuyer', 'ASC']]
      });

      const buyersWithExpenses = await Promise.all(buyers.map(async (buyer) => {
        // Получаем записи доходов и Firstdeps за указанный период
        const revenueRecords = await RevenueRecord.findAll({
          where: {
            buyerId: buyer.id,
            date: {
              [Op.between]: [
                dayjs(startDate).startOf('day').toDate(),
                dayjs(endDate).endOf('day').toDate()
              ]
            }
          }
        });

        // Подсчитываем общий доход и Firstdeps за указанный период
        const totalIncome = revenueRecords.reduce((sum, record) => sum + record.income, 0);
        
        const totalFirstdeps = revenueRecords.reduce((sum, record) => sum + record.firstdeps, 0);
  

        // Получаем общие расходы за указанный период
        const expenses = await getBuyerExpensesTotal(buyer.nameBuyer, startDate, endDate);

        const validExpenses = expenses.sumSpent || 0;
        const profit = totalIncome - validExpenses;

        let Roi = 0;
        if (validExpenses !== 0) {
          Roi = Math.round((totalIncome - validExpenses) / validExpenses * 100);
          Roi = Number.isFinite(Roi) ? Roi : 0;  // Проверка на NaN и Infinity
        }

        const formatCurrency = (value) => {
          return value < 0 ? `-$${Math.abs(value)}` : `$${value}`;
        };

        return {
          ...buyer.dataValues,
          totalIncome: formatCurrency(totalIncome),
          totalFirstdeps: totalFirstdeps || 0, // Добавляем подсчитанные Firstdeps
          expensesAgn: expenses.spentAgn,
          expensesAcc: expenses.spentAcc,
          profit: formatCurrency(profit),
          Roi: Roi
        };
      }));

      res.json(buyersWithExpenses);
    } else {
      res.status(403).json({ message: 'Доступ запрещен' });
    }
  } catch (error) {
    console.error('Ошибка получения списка байеров:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});



app.post('/api/webhook/postback', async (req, res) => {
  try {
    const postData = req.body;  
    console.log('Новые данные для CRM:', postData);
    
    const offerParts = postData.campaign_name.split('|');
    const responsiblePerson = offerParts[offerParts.length - 1].trim();
    postData.payout = Math.floor(parseFloat(postData.payout));

    const [buyer, created] = await BuyerModel.findOrCreate({
      where: { nameBuyer: responsiblePerson },
      defaults: { nameBuyer: responsiblePerson, countRevenue: postData.payout, countFirstdeps:1}
  });
  

    if (!created) {
        buyer.countRevenue += postData.payout;
        buyer.countFirstdeps += 1;
        await buyer.save();
    }
    const currentDate = moment().tz('Europe/Moscow').format('YYYY-MM-DD');
    const existingRecord = await RevenueRecord.findOne({
      where: { buyerId: buyer.id, date: currentDate }
    });
    if (existingRecord) {
     
      existingRecord.income += postData.payout;
      existingRecord.profit += postData.payout;
      existingRecord.firstdeps += 1;
      
      await existingRecord.save();
    } else {
   
    await RevenueRecord.create({
      buyerId: buyer.id,
      date: currentDate,
      income: postData.payout,
      expenses: 0, 
      profit: postData.payout,
      firstdeps:1,
    });
  }
    res.status(200).send('Postback data received');
  } catch (error) {
    console.error('Ошибка обработки postback:', error);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/api/buyer/:username/records', async (req, res) => {
  try {
    const { username } = req.params;
    const { startDate, endDate } = req.query;

    const buyer = await BuyerModel.findOne({ where: { nameBuyer: username } });

    if (buyer) {
      console.log(`С учетной записи байера пришел запрос с диапазоном дат ${startDate} - ${endDate}`);

      const filter = { buyerId: buyer.id };
      if (startDate && endDate) {
        const start = dayjs(startDate).startOf('day').toDate();
        const end = dayjs(endDate).endOf('day').toDate();
        filter.date = { [Op.between]: [start, end] };
      }

      // Получаем записи о доходах за указанный период
      const revenueRecords = await RevenueRecord.findAll({ where: filter });

      // Получаем все даты за указанный диапазон
      const dates = [];
      let currentDate = dayjs(startDate);
      const end = dayjs(endDate);
      while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
        dates.push(currentDate.format('YYYY-MM-DD'));
        currentDate = currentDate.add(1, 'day');
      }

      // Инициализируем переменные для суммирования
      let totalIncome = 0;
      let totalExpensesAgn = 0;
      let totalExpensesAcc = 0;
      let totalProfit = 0;
      let totalRecordsCount = 0;

      // Обрабатываем каждый день из диапазона
      const recordsWithExpenses = await Promise.all(dates.map(async (date) => {
        // Проверяем, есть ли запись о доходе за этот день
        const revenueRecord = revenueRecords.find(record => dayjs(record.date).format('YYYY-MM-DD') === date);

        // Получаем расходы за этот день
        const expenses = await getBuyerExpenses(username, date);
        const validExpenses = expenses?.sumSpent || 0;

        // Если записи о доходе нет, считаем доход = 0
        const income = revenueRecord ? revenueRecord.income : 0;

        // Рассчитываем прибыль
        const profit = income - validExpenses;

        // Рассчитываем ROI
        let Roi = 0;
        if (validExpenses !== 0) {
          Roi = Math.round((income - validExpenses) / validExpenses * 100);
          Roi = Number.isFinite(Roi) ? Roi : 0;
        }

        // Обновляем общие суммы
        totalIncome += income;
        totalExpensesAgn += expenses.spentAgn || 0;
        totalExpensesAcc += expenses.spentAcc || 0;
        totalProfit += profit;

        // Обновляем количество записей
        totalRecordsCount++;

        const formatCurrency = (value) => {
          return value < 0 ? `-$${Math.abs(value)}` : `$${value}`;
        };

        return {
          date,
          income: formatCurrency(income),
          expensesAgn: expenses.spentAgn || 0,
          expensesAcc: expenses.spentAcc || 0,
          profit: formatCurrency(profit) || 0,
          Roi: Roi
        };
      }));

      let totalRoi = 0;
      if ((totalExpensesAgn + totalExpensesAcc) !== 0) {
        totalRoi = Math.round((totalIncome - (totalExpensesAgn + totalExpensesAcc)) / (totalExpensesAcc + totalExpensesAgn) * 100);
        totalRoi = Number.isFinite(totalRoi) ? totalRoi : 0;
      }

      // Возвращаем записи и агрегированные данные
      res.json({
        records: recordsWithExpenses,
        totalIncome: totalIncome,
        totalExpensesAgn: totalExpensesAgn,
        totalExpensesAcc: totalExpensesAcc,
        totalProfit: totalProfit,
        totalRoi: totalRoi,
        totalRecordsCount: totalRecordsCount
      });
    } else {
      res.status(404).json({ message: 'Байер не найден' });
    }
  } catch (error) {
    console.error('Ошибка получения записей байера:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});


const startServer = async () => {
  try {
      await sequelize.authenticate();
      await sequelize.sync();
      
      console.log('Connected to database...');
      const now = moment().tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
      console.log(now)
      app.listen(PORT, () => {
          console.log(`Server is running on port ${PORT}`);
      });
  } catch (error) {
      console.error('Отсутствует подключение к БД', error);
  }
};

startServer();