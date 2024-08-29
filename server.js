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

    const iat = Math.floor(Date.now() / 1000);
    console.log('JWT issued at:', new Date(iat * 1000).toISOString());


    const sheetsApi = google.sheets({ version: 'v4', auth: authClient });

    const range = 'A1:K'; 
    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });

    const rows = response.data.values;

    if (rows.length) {
      const headers = rows[0];
      const buyerIndex = headers.indexOf(buyerName);
      if (buyerIndex === -1) {
        throw new Error(`Байер ${buyerName} не найден в таблице.`);
      }

      
      const spentAgnIndex = buyerIndex ; 
      const spentAccIndex = buyerIndex + 1; 

  
      const matchingRow = rows.find(row => row[0] === date);
      

      if (matchingRow) {
        const spentAgn = parseFloat(matchingRow[spentAgnIndex]) || 0;
        const spentAcc = parseFloat(matchingRow[spentAccIndex]) || 0;
        const sumSpent= spentAcc+spentAgn
       
       
        return { spentAgn, spentAcc,sumSpent };
      } else {
        throw new Error(`Данные за дату ${date} не найдены.`);
      }
    } else {
      throw new Error('Данные не найдены.');
    }
  } catch (error) {
    console.error('Error getting sheet data:', error);
  }
}

//Суммы расходов байеров
async function getBuyerExpensesTotal(buyerName) {
  try {
    const authClient = auth.fromJSON(serviceAccount);
    authClient.scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    

    const iat = Math.floor(Date.now() / 1000);
    console.log('JWT issued at:', new Date(iat * 1000).toISOString());


    const sheetsApi = google.sheets({ version: 'v4', auth: authClient });

    const range = 'A1:K'; // Диапазон, который нужно получить
    const response = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });
    const rows = response.data.values;
    if (rows.length) {
      const headers = rows[0]; // Первый ряд содержит имена байеров
      const buyerIndex = headers.indexOf(buyerName);

      if (buyerIndex === -1) {
        throw new Error(`Байер ${buyerName} не найден в таблице.`);
      }

      const spentAgnIndex = buyerIndex; 
      const spentAccIndex = buyerIndex + 1; 

      // Начинаем с четвертой строки, где начинаются данные
      const totalExpenses = rows.slice(3).reduce(
        (acc, row) => {
          const spentAgn = parseFloat(row[spentAgnIndex]) || 0;
          const spentAcc = parseFloat(row[spentAccIndex]) || 0;
          acc.spentAgn += spentAgn;
          acc.spentAcc += spentAcc;
          acc.sumSpent = spentAcc+spentAgn
          return acc;
        },
        { spentAgn: 0, spentAcc: 0,sumSpent:0,}
      );

      return totalExpenses;
    } else {
      throw new Error('Данные не найдены.');
    }
  } catch (error) {
    console.error('Error getting sheet data:', error);
    return { spentAgn: 0, spentAcc: 0, sumSpent:0,};
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

    if (adminUser) {
      
      const buyers = await BuyerModel.findAll({
        order: [['nameBuyer', 'ASC']]
      });
      
      const buyersWithExpenses = await Promise.all(buyers.map(async buyer => {
        const expenses = await getBuyerExpensesTotal(buyer.nameBuyer);
        
        
        const validExpenses = expenses.sumSpent || 0;
        const profit = buyer.countRevenue - validExpenses;


        let Roi = 0;
        if (validExpenses !== 0) {
          Roi = Math.round((buyer.countRevenue - validExpenses) / validExpenses * 100);
          Roi = Number.isFinite(Roi) ? Roi : 0;  // Проверка на NaN и Infinity
        }


        
        const formatCurrency = (value) => {
          return value < 0 ? `-$${Math.abs(value)}` : `$${value}`;
        };
        
        return {
          ...buyer.dataValues,
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
      await existingRecord.save();
    } else {
   
    await RevenueRecord.create({
      buyerId: buyer.id,
      date: currentDate,
      income: postData.payout,
      expenses: 0, 
      profit: postData.payout 
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
    
    const buyer = await BuyerModel.findOne({ where: { nameBuyer: username } });
    
    if (buyer) {
      const records = await RevenueRecord.findAll({ where: { buyerId: buyer.id } });

      const recordsWithExpenses = await Promise.all(records.map(async record => {
         

         const expenses = await getBuyerExpenses(username, record.date); 
       const validExpenses = expenses.sumSpent || 0;

       let Roi = 0;
       if (validExpenses !== 0) {
         Roi = Math.round((record.income - validExpenses) / validExpenses * 100);
         Roi = Number.isFinite(Roi) ? Roi : 0;  // Проверка на NaN и Infinity
       }
        const profit = record.income - validExpenses;

        const formatCurrency = (value) => {
          return value < 0 ? `-$${Math.abs(value)}` : `$${value}`;
        };


        return {
          ...record.toJSON(),
          expensesAcc: expenses.spentAcc,
          expensesAgn: expenses.spentAgn,
          profit: formatCurrency(profit) || 0, 
          Roi: Roi 
        };
      }));

      res.json(recordsWithExpenses);
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