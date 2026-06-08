from fastapi import APIRouter, HTTPException
import requests
import random
import os
from dotenv import load_dotenv
from app.recommend import get_recommendations
from cachetools import TTLCache
from app.database import users_collection

load_dotenv()

# Инициализируем роутер
router = APIRouter()

# Конфигурация TMDB
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
BASE_URL = "https://api.themoviedb.org/3"

# --- НАСТРОЙКА КЭША ---
movie_cache = TTLCache(maxsize=2000, ttl=3600)
list_cache = TTLCache(maxsize=50, ttl=600)


def check_api_key():
    if not TMDB_API_KEY:
        raise HTTPException(status_code=500, detail="Ключ TMDB не найден в .env файле")


# --- 1. ПОПУЛЯРНЫЕ ФИЛЬМЫ ---
@router.get("/movies/popular")
async def get_popular_movies():
    check_api_key()
    if "popular_list" in list_cache:
        data = list(list_cache["popular_list"])
        random.shuffle(data)
        return {"results": data}

    url = f"{BASE_URL}/movie/popular?api_key={TMDB_API_KEY}&language=ru-RU&page=1"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json().get("results", [])
        list_cache["popular_list"] = data
        random.shuffle(data)
        return {"results": data}
    except Exception as e:
        print(f"🔴 Ошибка TMDB (Popular): {e}")
        return {"results": []}


# --- 2. ВЫСОКИЙ РЕЙТИНГ (ТОТ САМЫЙ ЭНДПОИНТ ДЛЯ ИСПРАВЛЕНИЯ 422) ---
@router.get("/movies/top_rated")
async def fetch_top_rated():
    check_api_key()
    if "top_rated_list" in list_cache:
        data = list(list_cache["top_rated_list"])
        random.shuffle(data)
        return {"results": data}

    url = f"{BASE_URL}/movie/top_rated?api_key={TMDB_API_KEY}&language=ru-RU&page=1"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json().get("results", [])
        list_cache["top_rated_list"] = data
        random.shuffle(data)
        return {"results": data}
    except Exception as e:
        print(f"🔴 Ошибка TMDB (Top Rated): {e}")
        return {"results": []}


# --- 3. ПОЛУЧЕНИЕ ПО ЖАНРУ ---
@router.get("/movies/genre/{genre_id}")
async def get_movies_by_genre(genre_id: int):
    check_api_key()
    cache_key = f"genre_{genre_id}"
    if cache_key in list_cache:
        data = list(list_cache[cache_key])
        random.shuffle(data)
        return {"results": data[:10]}

    url = f"{BASE_URL}/discover/movie?api_key={TMDB_API_KEY}&language=ru-RU&with_genres={genre_id}&sort_by=popularity.desc"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json().get("results", [])
        list_cache[cache_key] = data
        random.shuffle(data)
        return {"results": data[:10]}
    except Exception as e:
        return {"results": []}


# --- 4. ПОИСК ---
@router.get("/movies/search")
async def search_movies(query: str):
    check_api_key()
    url = f"{BASE_URL}/search/movie?api_key={TMDB_API_KEY}&language=ru-RU&query={query}"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка поиска: {str(e)}")


# --- 5. РЕКОМЕНДАЦИИ ИИ (SVD) ---
@router.get("/movies/recommendations/{email}")
async def fetch_ai_recommendations(email: str):
    check_api_key()
    movie_ids = await get_recommendations(email)
    if not movie_ids:
        return {"results": []}

    results = []
    for m_id in movie_ids:
        if m_id in movie_cache:
            results.append(movie_cache[m_id])
            continue
        try:
            url = f"{BASE_URL}/movie/{m_id}?api_key={TMDB_API_KEY}&language=ru-RU"
            res = requests.get(url, timeout=2)
            if res.status_code == 200:
                movie_details = res.json()
                movie_cache[m_id] = movie_details
                results.append(movie_details)
        except Exception:
            continue
    random.shuffle(results)
    return {"results": results}


# --- 6. РЕКОМЕНДАЦИИ ПО АНКЕТЕ (PREF) ---
@router.get("/movies/by_preferences/{email}")
async def get_by_prefs(email: str):
    check_api_key()
    user = await users_collection.find_one({"email": email})
    if not user:
        return {"results": []}

    prefs = user.get("preferences", [])
    if not prefs:
        return {"results": []}

    genre_ids = []
    for p in prefs:
        try:
            genre_ids.append(int(p))
        except (ValueError, TypeError):
            continue

    if not genre_ids:
        url = f"{BASE_URL}/movie/popular?api_key={TMDB_API_KEY}&language=ru-RU"
    else:
        genres_str = ",".join(map(str, genre_ids))
        exclude_genres = ""
        if 16 not in genre_ids:
            exclude_genres = "&without_genres=16"

        url = (
            f"{BASE_URL}/discover/movie?api_key={TMDB_API_KEY}&language=ru-RU"
            f"&with_genres={genres_str}{exclude_genres}"
            f"&sort_by=vote_count.desc&vote_average.gte=5.5"
        )

    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json().get("results", [])
        random.shuffle(data)
        return {"results": data[:12]}
    except Exception as e:
        print(f"🔴 Ошибка в блоке PREF для {email}: {e}")
        return {"results": []}


# --- 7. СТАТИСТИКА ---
@router.get("/user/stats/{email}")
async def get_user_stats(email: str):
    user = await users_collection.find_one({"email": email})
    if not user or "favorites" not in user or not user["favorites"]:
        return {"total_rated": 0, "average_score": 0}
    favs = user["favorites"]
    ratings = [m.get("rating", 0) for m in favs if m.get("rating", 0) > 0]
    avg_score = sum(ratings) / len(ratings) if ratings else 0
    return {"total_rated": len(favs), "average_score": round(avg_score, 1)}


# --- 8. ДЕТАЛИ ФИЛЬМА (В САМОМ КОНЦЕ) ---
@router.get("/movies/{movie_id}")
async def get_movie_details(movie_id: int):
    check_api_key()
    movie_url = f"{BASE_URL}/movie/{movie_id}?api_key={TMDB_API_KEY}&language=ru-RU"
    video_url = (
        f"{BASE_URL}/movie/{movie_id}/videos?api_key={TMDB_API_KEY}&language=ru-RU"
    )
    try:
        movie_res = requests.get(movie_url, timeout=5).json()
        video_res = requests.get(video_url).json()
        trailer_key = None
        for video in video_res.get("results", []):
            if video["site"] == "YouTube" and video["type"] == "Trailer":
                trailer_key = video["key"]
                break
        movie_res["trailer_key"] = trailer_key
        return movie_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
