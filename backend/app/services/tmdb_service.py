import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("340370b92e5b1f0f2d0dd9848b0d96ed")
BASE_URL = "https://api.themoviedb.org/3"


def get_popular_movies():
    url = f"{BASE_URL}/movie/popular?api_key={API_KEY}"
    response = requests.get(url)
    return response.json()


def search_movies(query):
    url = f"{BASE_URL}/search/movie?api_key={API_KEY}&query={query}"
    response = requests.get(url)
    return response.json()