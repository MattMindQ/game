from contextlib import asynccontextmanager
from fastapi import FastAPI
from network.websocket import websocket_router
from data.config_service import ConfigService
from game.state.game_state_manager import GameStateManager  # New import
from game.loop import GameLoop  # New import
from game.behavior_manager import BehaviorManager  # New import
from llm.llm_call import LLMService  # New import
from network.command_handler import CommandHandler  # New import
from loguru import logger

# Global instances
game_state_manager: GameStateManager
game_loop: GameLoop
behavior_manager: BehaviorManager
llm_service: LLMService
command_handler: CommandHandler


@asynccontextmanager
async def lifespan(app: FastAPI):
    global game_state_manager, game_loop, behavior_manager, llm_service, command_handler

    # Startup: Initialize resources
    logger.info("Game server starting up")

    try:
        # Initialize core components
        game_state_manager = GameStateManager(bounds=(0, 0, 1000, 1000))
        behavior_manager = BehaviorManager()
        llm_service = LLMService()

        # Initialize and start the game loop
        game_loop = GameLoop(game_state_manager, broadcast_callback=None)  # Placeholder for broadcast callback
        await game_state_manager.initialize()
        await game_loop.start()

        # Initialize config service and ensure default config exists
        config_service = ConfigService()
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

        # Create the command handler and link it with global instances
        command_handler = CommandHandler(
            game_state_manager=game_state_manager,
            game_loop=game_loop,
            behavior_manager=behavior_manager,
            llm_service=llm_service,
            broadcast_callback=None  # Placeholder for broadcast callback
        )

    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise

    yield

    # Shutdown: Cleanup resources
    try:
        await game_loop.stop()
        logger.info("Game loop stopped")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

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
