# game_server/network/command_handler.py

from typing import Dict, Any, Optional, Callable
from loguru import logger
from game.state_manager import GameState
from game.loop import GameLoop
from game.behavior_manager import BehaviorManager
from llm.llm_call import LLMService
import json

class CommandHandler:
    def __init__(self, 
                 game_state: GameState,
                 game_loop: GameLoop,
                 behavior_manager: BehaviorManager,
                 llm_service: LLMService,
                 broadcast_callback: Callable):
        self.game_state = game_state
        self.game_loop = game_loop
        self.behavior_manager = behavior_manager
        self.llm_service = llm_service
        self.broadcast = broadcast_callback

    async def handle_command(self, command: Dict[str, Any]) -> None:
        """Main command routing"""
        try:
            cmd_type = command.get("type")
            if not cmd_type:
                logger.error("Command type missing")
                return

            logger.debug(f"Handling command: {cmd_type}")
            
            # Route to appropriate handler
            handlers = {
                "toggle_game": self._handle_toggle_game,
                "add_agent": self._handle_add_agent,
                "llm_query": self._handle_llm_query,
                "load_config": self._handle_load_config,
                "save_config": self._handle_save_config,
                "list_configs": self._handle_list_configs,
                "reset_game": self._handle_reset_game,
                "update_custom_behavior": self._handle_custom_behavior,
                "fetch_behaviors": self._handle_fetch_behaviors,
            }
            
            handler = handlers.get(cmd_type)
            if handler:
                await handler(command)
            else:
                logger.warning(f"Unknown command type: {cmd_type}")

        except Exception as e:
            logger.exception(f"Error handling command: {e}")

    async def _handle_toggle_game(self, command: Dict[str, Any]) -> None:
        """Handle game toggle command"""
        is_running = self.game_state.toggle_game_state()
        await self._broadcast_game_state()
        logger.info(f"Game state toggled: {'running' if is_running else 'stopped'}")

    async def _handle_add_agent(self, command: Dict[str, Any]) -> None:
        """Handle agent addition command"""
        team = command.get("team")
        if team in ["red", "blue"]:
            agent_id = self.game_state.add_agent(team)
            logger.info(f"Added agent {agent_id} to team {team}")
            await self._broadcast_game_state()
        else:
            logger.error(f"Invalid team: {team}")

    async def _handle_llm_query(self, command: Dict[str, Any]) -> None:
        """Handle LLM query command"""
        data = command.get("data", {})
        query = data.get("query")
        context = data.get("context")
        conversation_id = data.get("conversationId")

        if not query or not conversation_id:
            logger.error("Missing query or conversationId")
            await self._broadcast_llm_error(conversation_id, "Invalid query")
            return

        try:
            # Parse context if string
            if isinstance(context, str):
                context = json.loads(context)
            
            result = await self.llm_service.process_copilot_query(query, context)
            
            # Handle reformulation
            if result.get("reformulation"):
                await self._broadcast_llm_response(conversation_id, result["reformulation"])
            
            # Handle code
            if result.get("code"):
                code_response = f"Here's the code:\n```python\n{result['code']}\n```"
                await self._broadcast_llm_response(conversation_id, code_response)

        except Exception as e:
            logger.error(f"Error processing LLM query: {str(e)}")
            await self._broadcast_llm_error(conversation_id, "Failed to process query")

    async def _handle_load_config(self, command: Dict[str, Any]) -> None:
        """Handle config loading command"""
        config_id = command.get("config_id")
        if await self.game_state.load_config(config_id):
            await self._broadcast_game_state()
            await self.broadcast({
                "type": "config_loaded",
                "data": {"config_id": config_id}
            })

    async def _handle_save_config(self, command: Dict[str, Any]) -> None:
        """Handle config saving command"""
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

    async def _handle_list_configs(self, command: Dict[str, Any]) -> None:
        """Handle config listing command"""
        configs = await self.game_state.config_service.list_configs(
            self.game_state.active_user_id
        )
        await self.broadcast({
            "type": "config_list",
            "data": {"configs": configs}
        })

    async def _handle_reset_game(self, command: Dict[str, Any]) -> None:
        """Handle game reset command"""
        try:
            # Stop current game loop
            await self.game_loop.stop()
            
            # Create new game state
            self.game_state = GameState()
            await self.game_state.initialize()  # Initialize the new state
            
            # Create new game loop
            self.game_loop = GameLoop(self.game_state, self.broadcast)
            
            # Start if there are active connections
            if self.game_loop is not None:
                await self.game_loop.start()
                
            # Broadcast new state
            await self._broadcast_game_state()
            logger.info("Game reset successfully")
            
        except Exception as e:
            logger.error(f"Error resetting game: {e}")
            raise

    async def _handle_custom_behavior(self, command: Dict[str, Any]) -> None:
        """Handle custom behavior update command"""
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

    async def _broadcast_game_state(self) -> None:
        """Helper to broadcast game state"""
        state_update = self.game_state.get_state_update()
        await self.broadcast({
            "type": "game_state",
            "data": state_update
        })

    async def _broadcast_llm_response(self, conversation_id: str, response: str) -> None:
        """Helper to broadcast LLM response"""
        await self.broadcast({
            "type": "llm_response",
            "data": {
                "conversationId": conversation_id,
                "response": response
            }
        })

    async def _broadcast_llm_error(self, conversation_id: str, error: str) -> None:
        """Helper to broadcast LLM error"""
        await self.broadcast({
            "type": "llm_error",
            "data": {
                "conversationId": conversation_id,
                "error": error
            }
        })


    async def _handle_custom_behavior(self, command: Dict[str, Any]) -> None:
        """Handle custom behavior update command"""
        agent_id = command.get("agent_id")
        code = command.get("code")
        behavior_id = command.get("behavior_id", f"custom-{agent_id}")

        if not agent_id or not code:
            logger.error("Missing agent_id or code")
            await self.broadcast({
                "type": "behavior_update",
                "data": {"status": "error", "message": "Invalid agent_id or code"}
            })
            return
        
        success = self.behavior_manager.add_behavior(behavior_id, code)
        if success:
            self.behavior_manager.assign_behavior_to_agent(agent_id, behavior_id)
        await self.broadcast({
            "type": "behavior_update",
            "data": {
                "agent_id": agent_id,
                "status": "success" if success else "error",
                "message": None if success else "Failed to update behavior"
            }
        })

    async def _handle_fetch_behaviors(self, command: Dict[str, Any]) -> None:
        """Handle fetching all behaviors"""
        behaviors = [{"id": k, "code": v} for k, v in self.behavior_manager.custom_behaviors.items()]
        await self.broadcast({
            "type": "behavior_list",
            "data": {"behaviors": behaviors}
        })

    async def _handle_assign_behavior(self, command: Dict[str, Any]) -> None:
        """Assign a behavior to an agent"""
        agent_id = command.get("agent_id")
        behavior_id = command.get("behavior_id")

        if not agent_id or not behavior_id:
            logger.error("Missing agent_id or behavior_id")
            return
        
        success = self.behavior_manager.assign_behavior_to_agent(agent_id, behavior_id)
        await self.broadcast({
            "type": "behavior_assignment",
            "data": {
                "agent_id": agent_id,
                "behavior_id": behavior_id,
                "status": "success" if success else "error"
            }
        })
