import uvicorn
from rq import Queue
from redis import Redis
from celery import Celery
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from models import *
from core.db import engine
from api.main import api_router
from core.config import settings
from api.routes import members, auth, admin

app = FastAPI()

# Managing Redis queues directly with rq
redis_conn = Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT)
task_queue = Queue("task_queue", connection=redis_conn)

celery = Celery(
    __name__,
    broker=f"redis://{settings.REDIS_HOST}:6379/0",
    backend=f"redis://{settings.REDIS_HOST}:6379/0"
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get("/")
def read_root():
    return {"Hello": "World"}


@celery.task
def test_function(x, y):
    import time
    time.sleep(5)
    return x / y


app.include_router(api_router, prefix="/api")
app.include_router(auth.app)
app.include_router(members.app)
app.include_router(admin.app)

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
    Base.metadata.create_all(bind=engine)
