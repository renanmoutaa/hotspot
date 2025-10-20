from fastapi import FastAPI, APIRouter

app = FastAPI(title="Hotspot FastAPI", version="0.1.0")

router = APIRouter(prefix="/pyapi")

@router.get("/")
def root():
    return {"status": "ok", "backend": "fastapi"}

@router.get("/auth")
def auth():
    return {"message": "auth route placeholder"}

@router.get("/portal/status")
def portal_status():
    return {"portal": "online", "clients": 0}

@router.post("/portal/login")
def portal_login():
    return {"result": "login accepted (placeholder)"}

@router.post("/portal/logout")
def portal_logout():
    return {"result": "logout accepted (placeholder)"}

app.include_router(router)