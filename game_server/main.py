# game_server/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from network.websocket import websocket_router
from data.config_service import ConfigService
from loguru import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize resources
    logger.info("Game server starting up")
    
    # Initialize config service and ensure default config exists
    config_service = ConfigService()
    try:
        default_config = await config_service.get_default_config()
        if not default_config:
            await config_service.save_config({
                "name": "Default Configuration",
                "description": "Default game settings",
                "is_default": True,
                "parameters": {
                    "agentCount": 5,
                    "gameAreaSize": 1000,
                    "enableWorldLogic": True,
                    "visualRange": 150,
                    "recognitionRange": 100,
                    "combatRange": 30,
                    "baseDamage": 10,
                    "baseHealth": 100,
                    "baseSpeed": 5,
                    "turnSpeed": 0.1,
                    "behaviorUpdateInterval": 100,
                    "maxGroupSize": 5,
                    "flockingDistance": 50,
                    "obstacleCount": 10,
                    "obstacleSize": 20,
                    "boundaryDamage": 5,
                    "teamBalance": 0,
                    "respawnEnabled": True,
                    "respawnTime": 3000
                }
            })
            logger.info("Created default configuration")
    except Exception as e:
        logger.error(f"Error initializing default config: {e}")

    yield
    # Shutdown: Cleanup resources
    logger.info("Game server shutting down")

# Create FastAPI application with lifespan manager
app = FastAPI(
    title="Game Server",
    lifespan=lifespan
)

# Include WebSocket router
app.include_router(websocket_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=True
    )