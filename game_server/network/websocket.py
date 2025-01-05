# game_server/network/websocket.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set, Dict, Any
import json
from loguru import logger
from game.state.game_state_manager import GameStateManager  # Updated import
from game.loop import GameLoop
from game.behavior_manager import BehaviorManager
from llm.llm_call import LLMService
from .command_handler import CommandHandler

websocket_router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.initialize_services()

    def initialize_services(self):
        """Initialize or reinitialize all services"""
        # Initialize core services
        self.game_state_manager = GameStateManager(bounds=(0, 0, 800, 600))  # Use GameStateManager
        self.behavior_manager = BehaviorManager()
        self.llm_service = LLMService()
        
        # Initialize game loop with broadcast callback
        self.game_loop = GameLoop(self.game_state_manager, self.broadcast)
        
        # Initialize command handler
        self.command_handler = CommandHandler(
            game_state_manager=self.game_state_manager,
            game_loop=self.game_loop,
            behavior_manager=self.behavior_manager,
            llm_service=self.llm_service,
            broadcast_callback=self.broadcast
        )

    async def connect(self, websocket: WebSocket) -> None:
        """Handle new WebSocket connection"""
        try:
            await websocket.accept()
            self.active_connections.add(websocket)
            logger.info(f"Client connected. Total connections: {len(self.active_connections)}")
            
            # Start game loop if first connection
            if len(self.active_connections) == 1:
                await self.game_loop.start()
            
            # Send initial state
            initial_state = {
                "type": "game_state",
                "data": self.game_state_manager.get_state_update()  # Use GameStateManager's method
            }
            await websocket.send_json(initial_state)
            logger.debug(f"Sent initial state: {initial_state}")
            
        except Exception as e:
            logger.exception(f"Error during connection: {e}")
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
            raise

    async def reset_game_state(self):
        """Reset game state and related services"""
        if self.game_loop:
            await self.game_loop.stop()
        
        self.initialize_services()
        
        if self.active_connections:
            await self.game_loop.start()

    async def handle_command(self, command: Dict[str, Any]) -> None:
        """Route command to command handler"""
        if command.get("type") == "reset_game":
            await self.reset_game_state()
            # Broadcast new state to all clients
            await self.broadcast({
                "type": "game_state",
                "data": self.game_state_manager.get_state_update()  # Updated reset state
            })
        else:
            await self.command_handler.handle_command(command)

    async def disconnect(self, websocket: WebSocket) -> None:
        """Handle WebSocket disconnection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")
            
            # Stop game loop if no more connections
            if not self.active_connections:
                await self.game_loop.stop()

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
            
        disconnected = set()
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                disconnected.add(connection)
            except Exception as e:
                logger.exception(f"Error broadcasting to client: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            await self.disconnect(connection)

manager = ConnectionManager()

@websocket_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint handler"""
    try:
        await manager.connect(websocket)
        while True:
            try:
                data = await websocket.receive_text()
                command = json.loads(data)
                await manager.handle_command(command)
            except WebSocketDisconnect:
                logger.info("Client disconnected")
                break
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received: {e}")
            except Exception as e:
                logger.exception(f"Error handling websocket message: {e}")
                break
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
    finally:
        await manager.disconnect(websocket)
