import express, { Request, Response } from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
dotenv.config()

const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.send('Hello world!');
});

interface RequestBody {
  fullName?: string;
  phoneNumber?: string;
  willAttend?: boolean;
}

// Определяем типы для обработчика маршрута
type RequestHandler = (req: Request, res: Response) => Promise<void> | void;

// Используем правильную типизацию для app.post
app.post('/', (async (req: Request, res: Response) => {
  try {
    const { fullName, phoneNumber, willAttend } = req.body as RequestBody;

    if (!fullName || !phoneNumber || willAttend === undefined) {
      return res.status(400).json({ success: false, message: 'Не все поля заполнены' });
    }

    const attendance = willAttend ? 'Придет' : 'Не придет';
    const currentDate = new Date().toLocaleString('ru-RU');
    
    const message = `
📋 <b>Новая заявка</b>

👤 <b>Имя:</b> ${fullName}
📞 <b>Телефон:</b> ${phoneNumber || 'Не указан'}
✅ <b>Статус:</b> ${attendance}
🕒 <b>Дата заявки:</b> ${currentDate}
`.trim();

    const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: process.env.CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Ошибка при отправке в Telegram:', responseData);
      return res.status(500).json({ 
        success: false, 
        message: 'Ошибка при отправке заявки в Telegram',
        error: responseData
      });
    }
    
    console.log('Заявка успешно отправлена в Telegram:', responseData.ok);
    
    res.json({ success: true, message: 'Заявка успешно отправлена' });
  } catch (error) {
    console.error('Ошибка при отправке заявки:', error);
    res.status(500).json({ success: false, message: 'Ошибка при отправке заявки' });
  }
}) as RequestHandler);

app.listen(port, () => console.log(`Running on port ${port}`));