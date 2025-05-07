// Sprawdź, czy użytkownik jest zalogowany
if (window.location.pathname.includes('dashboard.html')) {
    const username = localStorage.getItem('username');
    if (!username) {
      window.location.href = '/index.html';
    }
  
    // Wylogowanie
    document.getElementById('logoutBtn').addEventListener('click', () => {
      localStorage.removeItem('username');
      window.location.href = '/index.html';
    });
  
    // Wysyłanie wiadomości
    document.getElementById('webhookForm').addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const webhookUrl = document.getElementById('webhookUrl').value;
      const content = document.getElementById('content').value;
      const embedTitle = document.getElementById('embedTitle').value;
      const embedDescription = document.getElementById('embedDescription').value;
      const embedColor = document.getElementById('embedColor').value;
      const responseDiv = document.getElementById('response');
  
      try {
        const response = await fetch('/api/send-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl,
            content,
            embedTitle,
            embedDescription,
            embedColor,
            username
          })
        });
        const data = await response.json();
  
        responseDiv.className = `response ${data.success ? 'success' : 'error'}`;
        responseDiv.innerHTML = data.message;
  
        // Odśwież logi po wysłaniu
        loadLogs();
      } catch (error) {
        responseDiv.className = 'response error';
        responseDiv.innerHTML = 'Błąd serwera';
      }
    });
  
    // Ładowanie logów
    async function loadLogs() {
      const logsDiv = document.getElementById('logs');
      try {
        const response = await fetch(`/api/logs/${username}`);
        const logs = await response.json();
  
        logsDiv.innerHTML = '';
        logs.forEach(log => {
          const logEntry = document.createElement('div');
          logEntry.className = 'log-entry';
          logEntry.innerHTML = `
            <small>${new Date(log.timestamp).toLocaleString()}</small>
            <p><strong>Webhook URL:</strong> ${log.webhookUrl}</p>
            ${log.content ? `<p><strong>Treść:</strong> ${log.content}</p>` : ''}
            ${log.embed.title ? `<p><strong>Tytuł embeda:</strong> ${log.embed.title}</p>` : ''}
            ${log.embed.description ? `<p><strong>Opis embeda:</strong> ${log.embed.description}</p>` : ''}
            ${log.embed.color ? `<p><strong>Kolor embeda:</strong> <span style="color: ${log.embed.color}">${log.embed.color}</span></p>` : ''}
          `;
          logsDiv.appendChild(logEntry);
        });
      } catch (error) {
        logsDiv.innerHTML = '<p class="error">Błąd podczas ładowania logów</p>';
      }
    }
  
    // Załaduj logi przy starcie
    loadLogs();
  }