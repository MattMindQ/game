# game_server/network/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set, Dict, Any
import json
from loguru import logger
from game.state import GameState
from game.loop import GameLoop
from game.behavior_manager import BehaviorManager
from llm.llm_call import LLMService

websocket_router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.game_state = GameState()
        self.behavior_manager = BehaviorManager()
        self.game_loop = GameLoop(self.game_state, self.broadcast)
        self.llm_service = LLMService()  # Initialize LLM service
        
    async def connect(self, websocket: WebSocket) -> None:
        """Handle new WebSocket connection."""
        try:
            await websocket.accept()
            self.active_connections.add(websocket)
            logger.info(f"Client connected. Total connections: {len(self.active_connections)}")
            
            # Start game loop if this is the first connection
            if len(self.active_connections) == 1:
                await self.game_loop.start()
            
            # Send initial state with full game information
            initial_state = {
                "type": "game_state",
                "data": {
                    **self.game_state.get_state_update(),
                    "agents": [agent.to_dict() for agent in self.game_state.agents.values()]
                }
            }
            await websocket.send_json(initial_state)
            logger.debug(f"Sent initial state: {initial_state}")
            
        except Exception as e:
            logger.exception(f"Error during connection: {e}")
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
            raise

    async def disconnect(self, websocket: WebSocket) -> None:
        """Handle WebSocket disconnection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")
            
            # Stop game loop if no more connections
            if not self.active_connections:
                await self.game_loop.stop()

    async def handle_command(self, command: Dict[str, Any]) -> None:
        """Handle incoming game commands."""
        try:
            cmd_type = command.get("type")
            if not cmd_type:
                logger.error("Command type missing")
                return
                
            logger.debug(f"Handling command: {cmd_type}")
            
            if cmd_type == "toggle_game":
                is_running = self.game_state.toggle_game_state()
                await self.broadcast_game_state()
                logger.info(f"Game state toggled: {'running' if is_running else 'stopped'}")
                
            elif cmd_type == "add_agent":
                team = command.get("team")
                if team in ["red", "blue"]:
                    agent_id = self.game_state.add_agent(team)
                    logger.info(f"Added agent {agent_id} to team {team}")
                    await self.broadcast_game_state()
                else:
                    logger.error(f"Invalid team: {team}")

            elif cmd_type == "llm_query":
                await self.handle_llm_query(command.get("data", {}))

            # Add new command handlers for config
            elif cmd_type == "load_config":
                config_id = command.get("config_id")
                if await self.game_state.load_config(config_id):
                    await self.broadcast_game_state()
                    await self.broadcast({
                        "type": "config_loaded",
                        "data": {"config_id": config_id}
                    })
                    
            if cmd_type == "save_config":
                config_data = command.get("config")
                if config_data:
                    config_id = await self.game_state.config_service.save_config(
                        config_data,
                        self.game_state.active_user_id
                    )
                    await self.broadcast({
                        "type": "config_saved",
                        "data": {"config_id": config_id}
                    })
                    
            elif cmd_type == "list_configs":
                configs = await self.game_state.config_service.list_configs(
                    self.game_state.active_user_id
                )
                await self.broadcast({
                    "type": "config_list",
                    "data": {"configs": configs}
                })
                
            elif cmd_type == "reset_game":
                # Stop current game loop
                await self.game_loop.stop()
                # Create new game state
                self.game_state = GameState()
                # Create new game loop with new state
                self.game_loop = GameLoop(self.game_state, self.broadcast)
                # Start new game loop if there are connections
                if self.active_connections:
                    await self.game_loop.start()
                await self.broadcast_game_state()
                logger.info("Game reset")
                
            elif cmd_type == "update_custom_behavior":
                agent_id = command.get("agent_id")
                code = command.get("code")
                
                if not agent_id or not code:
                    logger.error("Missing agent_id or code")
                    return
                    
                success = self.behavior_manager.add_behavior(agent_id, code)
                await self.broadcast({
                    "type": "behavior_update",
                    "data": {
                        "agent_id": agent_id,
                        "status": "success" if success else "error",
                        "message": None if success else "Failed to update behavior"
                    }
                })

        except Exception as e:
            logger.exception(f"Error handling command: {e}")



    async def handle_llm_query(self, data: Dict[str, Any]) -> None:
        """Handle LLM query from copilot."""
        try:
            query = data.get("query")
            context = data.get("context")
            conversation_id = data.get("conversationId")

            if not query or not conversation_id:
                logger.error("Missing query or conversationId")
                await self.broadcast({
                    "type": "llm_error",
                    "data": {
                        "conversationId": conversation_id,
                        "error": "Invalid query"
                    }
                })
                return

            # Parse context if it's a string
            if isinstance(context, str):
                try:
                    context = json.loads(context)
                except json.JSONDecodeError:
                    logger.error("Invalid context JSON")
                    context = {}

            # Process query with LLM service
            try:
                result = await self.llm_service.process_copilot_query(query, context)
                
                # Send reformulation
                if result.get("reformulation"):
                    await self.broadcast({
                        "type": "llm_response",
                        "data": {
                            "conversationId": conversation_id,
                            "response": result["reformulation"]
                        }
                    })
                
                # Send code if generated
                if result.get("code"):
                    await self.broadcast({
                        "type": "llm_response",
                        "data": {
                            "conversationId": conversation_id,
                            "response": f"Here's the code:\n```python\n{result['code']}\n```"
                        }
                    })

            except Exception as e:
                logger.error(f"Error processing LLM query: {str(e)}")
                await self.broadcast({
                    "type": "llm_error",
                    "data": {
                        "conversationId": conversation_id,
                        "error": "Failed to process query"
                    }
                })

        except Exception as e:
            logger.exception(f"Error in handle_llm_query: {e}")
            if conversation_id:
                await self.broadcast({
                    "type": "llm_error",
                    "data": {
                        "conversationId": conversation_id,
                        "error": "Internal server error"
                    }
                })

    async def broadcast_llm_response(self, conversation_id: str, response: str) -> None:
        """Broadcast LLM response to all clients."""
        await self.broadcast({
            "type": "llm_response",
            "data": {
                "conversationId": conversation_id,
                "response": response
            }
        })

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Broadcast message to all connected clients."""
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

    async def broadcast_game_state(self) -> None:
        """Broadcast current game state to all clients."""
        state_update = self.game_state.get_state_update()
        await self.broadcast({
            "type": "game_state",
            "data": state_update
        })

manager = ConnectionManager()

@websocket_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """WebSocket endpoint handler."""
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