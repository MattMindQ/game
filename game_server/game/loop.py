# game_server/game/loop.py

import asyncio
from typing import Callable
from loguru import logger
from .state.game_state_manager import GameStateManager  # Import the new manager
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
        """Check if game loop should run based on connection state"""
        return self.game_state_manager.is_running  # Use the manager's state
    
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
                    # Synchronize states and retrieve updates
                    delta_updates = self.game_state_manager.sync_states()

                    # Broadcast state updates
                    if delta_updates:
                        await self.broadcast_callback({
                            "type": "state_update",
                            "data": delta_updates
                        })

                    # Get the complete state update (if necessary)
                    full_state = self.game_state_manager.get_state_update()
                    if full_state:
                        await self.broadcast_callback({
                            "type": "game_update",
                            "data": full_state
                        })

                    # Periodic logging
                    frame_count += 1
                    if frame_count >= 60:  # roughly once per second at 60 FPS
                        logger.debug("Game loop running smoothly")
                        frame_count = 0

                await asyncio.sleep(UPDATE_INTERVAL)

            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.exception(f"Error in game loop: {e}")
                await asyncio.sleep(1)  # Wait before retrying
