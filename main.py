from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

EB_API_KEY = os.environ.get("EB_API_KEY", "")
EB_BASE = "https://api.easybroker.com/v1"

@app.get("/")
def root():
    return {"status": "Brokr API activa"}

@app.get("/propiedad/{property_id}")
async def get_propiedad(property_id: str):
    if not EB_API_KEY:
        raise HTTPException(status_code=500, detail="EB_API_KEY no configurada")
    headers = {"X-Authorization": EB_API_KEY, "accept": "application/json"}
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{EB_BASE}/properties/{property_id}", headers=headers)
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail="Error EasyBroker")
        return r.json()

@app.get("/propiedades")
async def get_propiedades(page: int = 1, limit: int = 20):
    if not EB_API_KEY:
        raise HTTPException(status_code=500, detail="EB_API_KEY no configurada")
    headers = {"X-Authorization": EB_API_KEY, "accept": "application/json"}
    params = {"page": page, "limit": limit}
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{EB_BASE}/properties", headers=headers, params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail="Error EasyBroker")
        return r.json()
