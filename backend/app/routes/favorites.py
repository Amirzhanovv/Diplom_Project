from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import users_collection

router = APIRouter()


# 1. Описываем модель данных, которую присылает React
class FavoriteMovie(BaseModel):
    email: str
    movie_id: int
    title: str
    poster_path: str
    release_date: str  # Чтобы не было "Н/Д" в библиотеке
    rating: Optional[int] = 0  # Наша оценка для AI (1-5)


# --- ЭНДПОИНТ: ДОБАВЛЕНИЕ ИЛИ ОБНОВЛЕНИЕ ОЦЕНКИ ---
@router.post("/favorites/add")
async def add_to_favorites(movie: FavoriteMovie):
    # Данные фильма, которые сохраним в массив favorites
    movie_data = {
        "movie_id": movie.movie_id,
        "title": movie.title,
        "poster_path": movie.poster_path,
        "release_date": movie.release_date,
        "rating": movie.rating,
    }

    # Логика:
    # 1. Сначала удаляем старую запись об этом фильме (если она есть),
    # чтобы обновить оценку, а не плодить дубликаты.
    await users_collection.update_one(
        {"email": movie.email}, {"$pull": {"favorites": {"movie_id": movie.movie_id}}}
    )

    # 2. Добавляем обновленные данные в массив favorites
    result = await users_collection.update_one(
        {"email": movie.email}, {"$addToSet": {"favorites": movie_data}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return {"message": "Оценка сохранена в базу!", "rating": movie.rating}


# --- ЭНДПОИНТ: ПОЛУЧЕНИЕ СПИСКА ИЗБРАННОГО ---
@router.get("/favorites/{email}")
async def get_favorites(email: str):
    user = await users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Возвращаем массив или пустой список
    return {"favorites": user.get("favorites", [])}
