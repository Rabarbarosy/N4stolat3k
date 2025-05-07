const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

// Middleware do parsowania JSON i obsługi statycznych plików
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ścieżki do plików JSON
const USERS_FILE = path.join(__dirname, 'users.json');
const LOGS_FILE = path.join(__dirname, 'logs.json');

// Inicjalizacja plików JSON, jeśli nie istnieją
async function initializeFiles() {
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }));
  }
  try {
    await fs.access(LOGS_FILE);
  } catch {
    await fs.writeFile(LOGS_FILE, JSON.stringify({ logs: [] }));
  }
}
initializeFiles();

// Endpoint do logowania
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const usersData = JSON.parse(data);
    const user = usersData.users.find(u => u.username === username && u.password === password);

    if (user) {
      res.json({ success: true, username });
    } else {
      res.status(401).json({ success: false, message: 'Nieprawidłowa nazwa użytkownika lub hasło' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// Endpoint do rejestracji (dla uproszczenia, dodajemy użytkownika ręcznie do users.json)
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const usersData = JSON.parse(data);

    if (usersData.users.find(u => u.username === username)) {
      return res.status(400).json({ success: false, message: 'Użytkownik już istnieje' });
    }

    usersData.users.push({ username, password });
    await fs.writeFile(USERS_FILE, JSON.stringify(usersData, null, 2));
    res.json({ success: true, message: 'Użytkownik zarejestrowany' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

// Endpoint do wysyłania wiadomości przez webhook
app.post('/api/send-webhook', async (req, res) => {
  const { webhookUrl, content, embedTitle, embedDescription, embedColor, username } = req.body;

  const embedColorDecimal = parseInt(embedColor.replace('#', ''), 16);
  const payload = {
    content: content || undefined,
    embeds: []
  };

  if (embedTitle || embedDescription) {
    const embed = {
      title: embedTitle || undefined,
      description: embedDescription || undefined,
      color: embedColorDecimal
    };
    payload.embeds.push(embed);
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      // Zapisz log
      const logData = await fs.readFile(LOGS_FILE, 'utf8');
      const logs = JSON.parse(logData);
      logs.logs.push({
        username,
        timestamp: new Date().toISOString(),
        webhookUrl,
        content,
        embed: { title: embedTitle, description: embedDescription, color: embedColor }
      });
      await fs.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2));

      res.json({ success: true, message: 'Wiadomość wysłana' });
    } else {
      res.status(response.status).json({ success: false, message: `Błąd: ${response.statusText}` });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: `Błąd: ${error.message}` });
  }
});

// Endpoint do pobierania logów użytkownika
app.get('/api/logs/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const data = await fs.readFile(LOGS_FILE, 'utf8');
    const logs = JSON.parse(data);
    const userLogs = logs.logs.filter(log => log.username === username);
    res.json(userLogs);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Błąd serwera' });
  }
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});