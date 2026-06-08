from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from app.routes import movies, auth, favorites
from app.database import client, users_collection  # Импорт клиента и коллекции
import uuid
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# --- Настройка CORS ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Подключение роутеров ---
app.include_router(movies.router)
app.include_router(auth.router)
app.include_router(favorites.router)

# Временное хранилище комнат Watch Party (в ОЗУ)
watch_rooms = {}


# --- События жизненного цикла БД ---
@app.on_event("startup")
async def startup_db_client():
    try:
        await client.admin.command("ping")
        print("Успешное подключение к MongoDB Atlas!")
    except Exception as e:
        print(f"Ошибка подключения к БД: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


# --- Эндпоинты Watch Party ---


@app.post("/rooms/create")
async def create_room(
    movie_id: int, creator_email: str, trailer_key: Optional[str] = None
):
    room_id = str(uuid.uuid4())[:8]
    watch_rooms[room_id] = {
        "movie_id": movie_id,
        "trailer_key": trailer_key,
        "creator": creator_email,
        "messages": [],
    }
    print(f"Создана комната {room_id} для фильма {movie_id}")
    return {"room_id": room_id}


@app.get("/rooms/{room_id}")
async def get_room(room_id: str):
    if room_id not in watch_rooms:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    return watch_rooms[room_id]


@app.post("/rooms/{room_id}/message")
async def send_message(room_id: str, email: str = Query(...), text: str = Query(...)):
    if room_id not in watch_rooms:
        raise HTTPException(status_code=404, detail="Комната не найдена")

    msg = {"user": email, "text": text}
    watch_rooms[room_id]["messages"].append(msg)
    return msg


# --- Работа с предпочтениями (Анкета) ---


class Preferences(BaseModel):
    email: str
    genres: List[int]


@app.post("/user/preferences")
async def save_preferences(prefs: Preferences):
    try:
        await users_collection.update_one(
            {"email": prefs.email}, {"$set": {"preferences": prefs.genres}}, upsert=True
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def root():
    return {"message": "AI Cinema backend работает"}
