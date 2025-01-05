from dataclasses import dataclass, field
from typing import Dict, Any, Optional
from uuid import UUID
from loguru import logger

from .base_state import BaseState
from data.config_service import ConfigService
from data.user_service import UserService

@dataclass
class ConfigStateData:
    """Configuration state data structure"""
    default_user: Optional[Dict[str, Any]] = None
    active_user_id: Optional[str] = None
    active_config: Optional[Dict[str, Any]] = None

class ConfigState(BaseState[ConfigStateData]):
    """Enhanced config state with component-based architecture"""
    
    
    def __init__(self):
        initial_data = ConfigStateData()
        super().__init__(initial_value=initial_data)
        self.config_service = ConfigService()
        self.user_service = UserService()
    
    async def initialize(self) -> None:
        """Initialize config and user state"""
        await self._initialize_user()
        await self._initialize_config()
    
    async def _initialize_user(self) -> None:
        """Initialize user state"""
        try:
            data = self.get_value()
            data.default_user = await self.user_service.get_or_create_default_user()
            data.active_user_id = data.default_user['_id']
            self.set_value(data)
            logger.info(f"Initialized with default user: {data.active_user_id}")
        except Exception as e:
            logger.exception(f"Error initializing user: {e}")
    
    async def _initialize_config(self) -> None:
        """Initialize configuration state"""
        try:
            data = self.get_value()
            data.active_config = await self.config_service.get_default_config()
            if not data.active_config:
                logger.warning("No default config found")
            self.set_value(data)
        except Exception as e:
            logger.exception(f"Error initializing config: {e}")
    
    async def load_config(self, config_id: str) -> bool:
        """Load a specific configuration"""
        try:
            data = self.get_value()
            config = await self.config_service.get_config(config_id)
            
            if config:
                if config.get('is_default') or config.get('user_id') == data.active_user_id:
                    data.active_config = config
                    self.set_value(data)
                    return True
            return False
            
        except Exception as e:
            logger.exception(f"Error loading config: {e}")
            return False
    
    def apply_config_to_agent(self, agent: 'Agent') -> None:
        """Apply current configuration to a single agent"""
        data = self.get_value()
        if not data.active_config:
            return
        
        params = data.active_config.get('parameters', {})
        
        agent.combat.max_health = params.get('baseHealth', 100)
        agent.combat.damage = params.get('baseDamage', 10)
        agent.movement.speed = params.get('baseSpeed', 5)
        agent.movement.turn_speed = params.get('turnSpeed', 0.1)
    
    def get_state(self) -> Dict[str, Any]:
        """Get serializable state"""
        data = self.get_value()
        if data.active_config:
            return {
                "id": data.active_config.get('_id'),
                "name": data.active_config.get('name'),
                "parameters": data.active_config.get('parameters', {})
            }
        return None
    
    def get_user_state(self) -> Dict[str, Any]:
        """Get current user state"""
        data = self.get_value()
        return {
            "id": data.active_user_id,
            "is_default": (
                data.default_user is not None and 
                data.active_user_id == data.default_user['_id']
            )
        }