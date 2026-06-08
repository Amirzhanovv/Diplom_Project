import pandas as pd
from surprise import SVD, Dataset, Reader
from app.database import users_collection
import random


async def get_recommendations(user_email: str):
    all_users = await users_collection.find().to_list(length=1000)
    user_data = await users_collection.find_one({"email": user_email})

    if not user_data:
        return []

    user_liked = [f["movie_id"] for f in user_data.get("favorites", [])]
    data_list = []

    for user in all_users:
        uid = user["email"]
        for fav in user.get("favorites", []):
            # Используем реальный рейтинг пользователя (или 5, если рейтинга нет)
            score = fav.get("rating", 5)
            data_list.append([uid, fav["movie_id"], score])

    # Если данных достаточно для SVD
    if len(data_list) > 5:
        try:
            df = pd.DataFrame(data_list, columns=["userID", "itemID", "rating"])
            reader = Reader(rating_scale=(1, 5))
            dataset = Dataset.load_from_df(df[["userID", "itemID", "rating"]], reader)

            trainset = dataset.build_full_trainset()
            algo = SVD()
            algo.fit(trainset)

            all_movie_ids = df["itemID"].unique()
            predictions = []

            for m_id in all_movie_ids:
                if m_id not in user_liked:
                    pred = algo.predict(user_email, int(m_id))
                    predictions.append((int(m_id), pred.est))

            # Сортируем по оценке ИИ
            predictions.sort(key=lambda x: x[1], reverse=True)

            if predictions:
                # Берем ТОП-15 лучших и выбираем из них 5 случайных
                top_15 = predictions[:15]
                count = min(len(top_15), 5)
                final_recs = random.sample(top_15, count)
                return [p[0] for p in final_recs]
        except:
            pass

    # Фолбэк (Запасной вариант): фильмы, которые лайкали другие, но не вы
    other_likes = [
        d[1] for d in data_list if d[0] != user_email and d[1] not in user_liked
    ]
    if other_likes:
        return random.sample(list(set(other_likes)), min(len(set(other_likes)), 5))

    return []
