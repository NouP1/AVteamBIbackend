# AVteamBi 📊📈

BI-система для аналитики и визуализации статистики за выбранный период. Построена с использованием **React**, **MUI**, и серверной части на **Express, SQLite, Sequelize**.

---

## 🧠 Описание

**AVteamBi** — это pet-проект, реализующий **веб-приложение для бизнес-аналитики** и решающий бизнес задачу по сбору и обработке данных с возможностью фильтрации и отображения данных в таблицах, графиках и рейтингах. Основной стек — **frontend на React** с компонентным подходом и **backend на Express** с ORM-обработкой данных из SQLite и Google Sheets и кешированием использованных страниц в googl таблицах, упрощенной аутентификацией через пароль и email, представляющий последний сервис (компонент) всей структуры обработки событий из трекера.

![Снимок экрана 2025-04-06 132217](https://github.com/user-attachments/assets/9411af92-2e8b-4c59-9ac5-f7bbd08ebfd9)
![Снимок экрана 2025-04-06 132147](https://github.com/user-attachments/assets/380ea384-ba4c-44cd-8b39-e2ae5fdff419)
![Снимок экрана 2025-04-06 132119](https://github.com/user-attachments/assets/550a5c3a-71c8-426f-8d2f-dfde85e76496)
![Снимок экрана 2025-04-06 132046](https://github.com/user-attachments/assets/4db968b9-57b9-47b7-8a2f-7e896db9046a)


Приложение предоставляет:

- 📅 Выбор периода времени (через MUI календарь)
- 📊 Отображение таблиц, статистики, рейтингов
- 🔁 Интеграция с Google Sheets (через GAPI)
- 🚀 Быстрый REST API с Express
- ⚙️ ORM через Sequelize для работы с базой данных SQLite

---

## 🧩 Стек технологий

| Технология       | Назначение                                      |
|------------------|-------------------------------------------------|
| React            | Интерфейс и компонентный подход                 |
| JSX              | Разметка компонентов                            |
| MUI              | UI-компоненты: таблицы, иконки, календарь       |
| Express.js       | Backend и REST API                              |
| SQLite           | База данных                                     |
| Sequelize        | ORM для работы с БД                             |
| GAPI             | Интеграция с Google Sheets                      |
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
