import os
import certifi  # Импортируем установленный модуль
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Загружаем переменные из .env
load_dotenv()

# Достаем ссылку на подключение
MONGODB_URL = os.getenv("MONGODB_URL")

# Создаем клиент.
# tlsCAFile=certifi.where() — это "магическая" добавка, которая лечит ошибку SSL на Windows
client = AsyncIOMotorClient(MONGODB_URL, tlsCAFile=certifi.where())

# Указываем имя базы данных
db = client.ai_cinema_db

# Указываем коллекцию для пользователей
users_collection = db.get_collection("users")
