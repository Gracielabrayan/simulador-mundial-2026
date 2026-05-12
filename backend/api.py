import random as rd
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulacionRequest(BaseModel):
    figus_total: int
    figus_paquete: int
    amigos: int
    n_simulaciones: int
    semilla: int

def esperanza_teorica(figus_total, figus_paquete):
    e = sum([figus_total / (figus_total - i + 1) for i in range(1, figus_total + 1)])
    return e / figus_paquete

def simular_album(figus_total, figus_paquete, amigos=0):
    album = set()
    paquetes = 0
    while len(album) < figus_total:
        paquete = rd.sample(range(1, figus_total + 1), min(figus_paquete, figus_total))
        album.update(paquete)
        paquetes += 1
        for _ in range(amigos):
            paquete_amigo = rd.sample(range(1, figus_total + 1), min(figus_paquete, figus_total))
            album.update(paquete_amigo)
    return paquetes

@app.post("/simulate")
def simulate(req: SimulacionRequest):
    # Fija la semilla para reproducibilidad exacta
    rd.seed(req.semilla)

    prom_teorico = esperanza_teorica(req.figus_total, req.figus_paquete)
    muestras = [simular_album(req.figus_total, req.figus_paquete, req.amigos) for _ in range(req.n_simulaciones)]

    return {
        "promedio_simulado": round(float(np.mean(muestras)), 1),
        "promedio_teorico": round(float(prom_teorico), 1),
        "data": muestras
    }

# RUTA PARA EL CRON-JOB (Keep Alive)
@app.get("/health")
def health():
    return {"status": "Estadio encendido y listo para el Kick Off"}

@app.post("/simulate")
def simulate(req: SimulacionRequest):
    rd.seed(req.semilla)
    prom_teorico = esperanza_teorica(req.figus_total, req.figus_paquete)
    muestras = [simular_album(req.figus_total, req.figus_paquete, req.amigos) for _ in range(req.n_simulaciones)]

    return {
        "promedio_simulado": round(float(np.mean(muestras)), 1),
        "promedio_teorico": round(float(prom_teorico), 1),
        "data": muestras
    }