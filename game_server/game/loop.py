# game_server/game/loop.py

import asyncio
from typing import Callable
from loguru import logger
from .state import GameState
from .constants import UPDATE_INTERVAL

class GameLoop:
    def __init__(self, game_state: GameState, broadcast_callback: Callable):
        self.game_state = game_state
        self.broadcast_callback = broadcast_callback
        self.is_running = False
        self.task = None

    async def start(self):
        if not self.task:
            self.is_running = True
            self.task = asyncio.create_task(self._loop())
            logger.info("Game loop started")

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
                if self.game_state.is_running:
                    # The world update happens inside state.update().
                    state = self.game_state.update()
                    
                    # Broadcast game update
                    await self.broadcast_callback({
                        "type": "game_update",
                        "data": {
                            "timestamp": state["timestamp"],
                            "agents": state["agents"],
                            "stats": state["stats"]
                        }
                    })
                    
                    # Broadcast combat event if needed
                    if "recent_kills" in state and state["recent_kills"]:
                        await self.broadcast_callback({
                            "type": "combat_event",
                            "data": {
                                "kills": state["recent_kills"],
                                "stats": state["stats"]
                            }
                        })

                    # Periodic logging
                    frame_count += 1
                    if frame_count >= 60:  # roughly once per second at 60 FPS
                        logger.debug(f"Game running with {len(self.game_state.agents)} agents")
                        frame_count = 0
                
                await asyncio.sleep(UPDATE_INTERVAL)
                    
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.exception(f"Error in game loop: {e}")
                await asyncio.sleep(1)  # Wait before retrying
