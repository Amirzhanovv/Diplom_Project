from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os
from app.database import users_collection

router = APIRouter()

# Настройка хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Настройки для токена
SECRET_KEY = os.getenv("SECRET_KEY", "default_secret")
ALGORITHM = "HS256"

# Модель того, что мы ждем от React (email и пароль)
class UserAuth(BaseModel):
    email: str
    password: str

# --- 1. РЕГИСТРАЦИЯ ---
@router.post("/register")
async def register(user: UserAuth):
    # Проверяем, есть ли уже такой email
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Этот email уже зарегистрирован")

    # Хешируем пароль (чтобы в базе не было паролей открытым текстом)
    hashed_password = pwd_context.hash(user.password)

    # Создаем пользователя (сразу добавляем пустые списки для Этапа 7)
    new_user = {
        "email": user.email,
        "password": hashed_password,
        "favorites": [],
        "ratings": []
    }
    
    await users_collection.insert_one(new_user)
    return {"message": "Успешная регистрация!"}

# --- 2. ЛОГИН (ВХОД) ---
@router.post("/login")
async def login(user: UserAuth):
    # Ищем пользователя в базе
    db_user = await users_collection.find_one({"email": user.email})
    
    # Сверяем пароли
    if not db_user or not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    # Генерируем JWT-токен на 7 дней
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode = {"sub": user.email, "exp": expire}
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token, "token_type": "bearer", "email": user.email}