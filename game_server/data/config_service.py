# game_server/data/config_service.py
from datetime import datetime
from typing import List, Dict, Any, Optional
from .db_connector import DatabaseConnector
import logging

logger = logging.getLogger(__name__)

class ConfigService:
    def __init__(self):
        self.db = DatabaseConnector()

    async def save_config(self, config_data: dict, user_id: str) -> str:
        try:
            config_data['created_at'] = datetime.utcnow()
            config_data['updated_at'] = datetime.utcnow()
            config_data['user_id'] = user_id  # Add user_id to config
            
            result = self.db.configs.insert_one(config_data)
            logger.info(f"Saved config with ID: {result.inserted_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error saving config: {str(e)}")
            raise



    async def get_config(self, config_id: str) -> Optional[Dict[str, Any]]:
        try:
            config = self.db.configs.find_one({"_id": self.db.to_object_id(config_id)})
            return self.db.format_id(config)
            
        except Exception as e:
            logger.error(f"Error retrieving config: {str(e)}")
            raise

    async def list_configs(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            # Create query that includes default configs and user's configs
            query = {"$or": [{"is_default": True}]}
            if user_id:
                query["$or"].append({"user_id": user_id})

            configs = []
            cursor = self.db.configs.find(query).sort('created_at', -1)
            for config in cursor:
                configs.append(self.db.format_id(config))
            return configs
            
        except Exception as e:
            logger.error(f"Error listing configs: {str(e)}")
            raise



    async def update_config(self, config_id: str, updates: dict) -> bool:
        try:
            updates['updated_at'] = datetime.utcnow()
            
            result = self.db.configs.update_one(
                {"_id": self.db.to_object_id(config_id)},
                {"$set": updates}
            )
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating config: {str(e)}")
            raise

    async def delete_config(self, config_id: str, user_id: str) -> bool:
        try:
            # Only allow deletion if config belongs to user and is not default
            result = self.db.configs.delete_one({
                "_id": self.db.to_object_id(config_id),
                "user_id": user_id,
                "is_default": {"$ne": True}
            })
            logger.info(f"Deleted config {config_id}: {result.deleted_count} document(s) deleted")
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting config: {str(e)}")
            raise

    async def get_default_config(self) -> Optional[Dict[str, Any]]:
        try:
            config = self.db.configs.find_one({"is_default": True})
            return self.db.format_id(config)
        except Exception as e:
            logger.error(f"Error retrieving default config: {str(e)}")
            raise


