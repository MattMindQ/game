from typing import Dict, Optional
from loguru import logger
from data.config_service import ConfigService

class ConfigManager:
    def __init__(self, config_service: ConfigService):
        self.config_service = config_service
        self.active_config = None

    async def initialize_config(self):
        try:
            self.active_config = await self.config_service.get_default_config()
            if not self.active_config:
                logger.warning("No default config found")
        except Exception as e:
            logger.error(f"Error initializing config: {e}")

    async def load_config(self, config_id: str, user_id: str) -> bool:
        try:
            config = await self.config_service.get_config(config_id)
            if config and (config.get('is_default') or config.get('user_id') == user_id):
                self.active_config = config
                return True
            return False
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return False

    def get_active_config(self) -> Optional[Dict]:
        return self.active_config
