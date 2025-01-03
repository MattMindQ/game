# game_server/data/user_service.py
from datetime import datetime
from typing import List, Dict, Any, Optional
from .db_connector import DatabaseConnector
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        self.db = DatabaseConnector()

    async def get_or_create_default_user(self) -> Dict[str, Any]:
        try:
            default_user = self.db.users.find_one({"is_default": True})
            if not default_user:
                default_user = {
                    "username": "default_user",
                    "is_default": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "settings": {
                        "theme": "dark",
                        "notifications": True
                    }
                }
                result = self.db.users.insert_one(default_user)
                default_user['_id'] = result.inserted_id
                logger.info(f"Created default user with ID: {result.inserted_id}")
            
            return self.db.format_id(default_user)
            
        except Exception as e:
            logger.error(f"Error with default user: {str(e)}")
            raise

    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            user = self.db.users.find_one({"_id": self.db.to_object_id(user_id)})
            return self.db.format_id(user)
        except Exception as e:
            logger.error(f"Error retrieving user: {str(e)}")
            raise
