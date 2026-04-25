from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings

app = FastAPI(title='Skill Assessment Agent API', version='0.1.0')

default_origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://your-vercel-frontend-url.vercel.app',
]
env_origins = [o.strip() for o in settings.cors_origins.split(',') if o.strip()]
origins = list(dict.fromkeys(default_origins + env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health():
    return {'status': 'ok'}


app.include_router(router)
