# game_server/game/state/config_state.py

from typing import Dict, Any, Optional
from loguru import logger
from data.config_service import ConfigService
from data.user_service import UserService
from ..models import Agent

class ConfigState:
    def __init__(self):
        # Services
        self.config_service = ConfigService()
        self.user_service = UserService()
        
        # State
        self.default_user = None
        self.active_user_id = None
        self.active_config = None

    async def initialize(self) -> None:
        """Initialize config and user state"""
        await self._initialize_user()
        await self._initialize_config()

    async def _initialize_user(self) -> None:
        """Initialize user state"""
        try:
            self.default_user = await self.user_service.get_or_create_default_user()
            self.active_user_id = self.default_user['_id']
            logger.info(f"Initialized with default user: {self.active_user_id}")
        except Exception as e:
            logger.error(f"Error initializing user: {e}")

    async def _initialize_config(self) -> None:
        """Initialize configuration state"""
        try:
            self.active_config = await self.config_service.get_default_config()
            if not self.active_config:
                logger.warning("No default config found")
        except Exception as e:
            logger.error(f"Error initializing config: {e}")

    async def load_config(self, config_id: str) -> bool:
        """Load a specific configuration"""
        try:
            config = await self.config_service.get_config(config_id)
            if config:
                if config.get('is_default') or config.get('user_id') == self.active_user_id:
                    self.active_config = config
                    return True
            return False
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return False

    def apply_config_to_agent(self, agent: Agent) -> None:
        """Apply current configuration to a single agent"""
        if not self.active_config:
            return

        params = self.active_config.get('parameters', {})
        
        agent.combat.max_health = params.get('baseHealth', 100)
        agent.combat.damage = params.get('baseDamage', 10)
        agent.movement.speed = params.get('baseSpeed', 5)
        agent.movement.turn_speed = params.get('turnSpeed', 0.1)

    def apply_global_config(self) -> None:
        """Apply configuration to global game parameters"""
        if not self.active_config:
            return

        params = self.active_config.get('parameters', {})
        
        Agent.VISUAL_RANGE = params.get('visualRange', 150)
        Agent.RECOGNITION_RANGE = params.get('recognitionRange', 100)
        Agent.COMBAT_RANGE = params.get('combatRange', 30)

    def get_config_state(self) -> Dict[str, Any]:
        """Get current configuration state"""
        if self.active_config:
            return {
                "id": self.active_config.get('_id'),
                "name": self.active_config.get('name'),
                "parameters": self.active_config.get('parameters', {})
            }
        return None

    def get_user_state(self) -> Dict[str, Any]:
        """Get current user state"""
        return {
            "id": self.active_user_id,
            "is_default": (
                self.default_user is not None and 
                self.active_user_id == self.default_user['_id']
            )
        }