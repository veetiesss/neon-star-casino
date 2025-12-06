// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const path = require("path");
app.use(express.static(path.join(__dirname)));


app.use(express.json());
app.use(cors()); // чтобы фронтенд мог обращаться

// ======= Подключение к MongoDB =======
mongoose.connect('mongodb+srv://admin:admintop@cluster0.drphoeg.mongodb.net')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const UserSchema = new mongoose.Schema({
    nickname: { type: String, unique: true },
    balance: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);

// ======= API =======
app.use(express.static(__dirname)); // отдаём файлы из той же папки

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
  });

// Проверка/создание пользователя
app.post('/login', async (req, res) => {
    const { nickname } = req.body;
    if (!nickname) return res.status(400).json({ error: 'Введите никнейм' });

    try {
        let user = await User.findOne({ nickname });
        if (!user) {
            user = new User({ nickname });
            await user.save();
        }
        res.json({ nickname: user.nickname, balance: user.balance });
    } catch (e) {
        res.status(500).json({ error: 'Ошибка сервера или ник занят' });
    }
});

// Получение баланса
app.get('/balance/:nickname', async (req, res) => {
    const { nickname } = req.params;
    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ balance: user.balance });
});

// Обновление баланса
app.post('/balance/:nickname', async (req, res) => {
    const { nickname } = req.params;
    const { balance } = req.body;

    const user = await User.findOne({ nickname });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    user.balance = balance;
    await user.save();

    res.json({ balance: user.balance });
});

app.post('/register', async (req, res) => {
  let { nickname } = req.body; // <- убедимся, что req.body есть
  if (typeof nickname !== 'string') {
    return res.status(400).json({ error: 'Неверный формат ника' });
  }

  nickname = nickname.trim();
  if (!nickname) return res.status(400).json({ error: 'Введите никнейм' });

  try {
    const existingUser = await User.findOne({ nickname });
    if (existingUser) return res.status(400).json({ error: 'Никнейм уже занят' });

    const newUser = new User({ nickname });
    await newUser.save();

    res.status(201).json({ message: 'Пользователь зарегистрирован', nickname: newUser.nickname, balance: newUser.balance });
  } catch (e) {
    console.error('Ошибка регистрации:', e);
    res.status(500).json({ error: 'Ошибка сервера', details: e.message });
  }
});


const PORT = process.env.PORT || 3000; // Render задаёт свой порт через переменную окружения
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
