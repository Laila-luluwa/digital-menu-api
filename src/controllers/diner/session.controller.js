import { v4 as uuidv4 } from 'uuid';

// Контроллер для создания сессии гостя при сканировании QR
export const startSession = async (req, res) => {
  const { table_code } = req.body;

  if (!table_code) {
    return res.status(400).json({ 
      success: false, 
      message: "Table code is required (сканируй QR заново)" 
    });
  }

  try {
    // Генерируем уникальный токен сессии
    const sessionToken = uuidv4();

    // Устанавливаем время жизни сессии (например, 2 часа от текущего момента)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    /* ПОДСКАЗКА ДЛЯ НАПАРНИЦЫ:
       Когда база будет готова, здесь нужно будет сделать:
       await prisma.table_sessions.create({ data: { ... } })
    */

    res.status(201).json({
      success: true,
      token: sessionToken,
      table_code: table_code,
      expiresAt: expiresAt
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};