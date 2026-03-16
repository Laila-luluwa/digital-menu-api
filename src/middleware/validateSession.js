// Middleware для проверки: жива ли еще сессия гостя
export const validateSession = (req, res, next) => {
  // 1. Пытаемся достать токен из заголовков (headers)
  const token = req.headers['x-session-token'];
  
  // В реальном приложении мы бы достали время из БД по этому токену.
  // Пока у нас нет БД, мы "поверим" токену, если он пришел, 
  // но добавим логику проверки времени для примера.

  if (!token) {
    return res.status(401).json({ 
      error: "No session token! Сначала отсканируй QR-код." 
    });
  }

  // Эмуляция проверки времени (Hard Part)
  const now = new Date();
  
  /* TODO: Когда напарница доделает БД:
     const session = await prisma.table_sessions.findUnique({ where: { token } });
     if (now > session.expires_at) return res.status(403).json({ error: "Session expired" });
  */

  console.log(`[Auth] Сессия ${token} проверена в ${now.toLocaleTimeString()}`);
  
  next(); // Если всё ок, пропускаем запрос дальше к контроллеру
};