# game_server/game/loop.py

import asyncio
from typing import Callable
from loguru import logger
from .state.game_state_manager import GameStateManager
from .constants import UPDATE_INTERVAL

class GameLoop:
    def __init__(self, game_state_manager: GameStateManager, broadcast_callback: Callable):
        self.game_state_manager = game_state_manager
        self.broadcast_callback = broadcast_callback
        self.is_running = False
        self.task = None

    async def start(self):
        if not self.task:
            self.is_running = True
            self.task = asyncio.create_task(self._loop())
            logger.info("Game loop started")
    
    def should_run(self) -> bool:
        return self.game_state_manager.is_running
    
    async def stop(self):
        if self.task:
            self.is_running = False
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            self.task = None
            logger.info("Game loop stopped")

    async def _loop(self):
        frame_count = 0
        while self.is_running:
            try:
                if self.should_run():
                    # Update game state
                    self._update_game_state()
                    
                    # Synchronize states and retrieve updates
                    delta_updates = self.game_state_manager.sync_states()

                    # Broadcast state updates
                    if delta_updates:
                        await self.broadcast_callback({
                            "type": "state_update",
                            "data": delta_updates
                        })

                    # Get the complete state update
                    full_state = self.game_state_manager.get_state_update()
                    if full_state:
                        await self.broadcast_callback({
                            "type": "game_update",
                            "data": full_state
                        })

                    # Periodic logging
                    frame_count += 1
                    if frame_count >= 60:
                        logger.debug("Game loop running smoothly")
                        frame_count = 0

                await asyncio.sleep(UPDATE_INTERVAL)

            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.exception(f"Error in game loop: {e}")
                await asyncio.sleep(1)  # Wait before retrying

    def _update_game_state(self):
        """Update game state including behaviors and physics"""
        try:
            # Get all agents
            agents = self.game_state_manager.agent_state.get_agents_list()
            
            # Update behaviors
            for agent in agents:
                # Get current behavior from state
                current_behavior = self.game_state_manager.behavior_state.get_agent_behavior(agent.id)
                
                # Update agent behavior
                agent.update_behavior(current_behavior, agents)
                
                # Increment behavior timer
                self.game_state_manager.behavior_state.increment_behavior_timer(agent.id, UPDATE_INTERVAL)
            
            # Update positions
            for agent in agents:
                agent.update_position()
            
            # Let behavior state evaluate and potentially change behaviors
            self.game_state_manager.agent_state.update_behaviors()
            
        except Exception as e:
            logger.error(f"Error updating game state: {e}")