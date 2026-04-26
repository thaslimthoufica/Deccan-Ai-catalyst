from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request

from app.api.routes import router
from app.core.config import settings

app = FastAPI(title='Skill Assessment Agent API', version='0.1.0')

origins = [o.strip() for o in settings.cors_origins.split(',') if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.middleware('http')
async def log_requests(request: Request, call_next):
    print(f'{request.method} {request.url.path}')
    return await call_next(request)


@app.get('/health')
def health():
    return {'status': 'ok'}


app.include_router(router)
