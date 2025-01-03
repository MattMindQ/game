# game_server/data/behavior_service.py
from datetime import datetime
from typing import List, Dict, Any
from .db_connector import DatabaseConnector
import logging

logger = logging.getLogger(__name__)

class BehaviorService:
    def __init__(self):
        self.db = DatabaseConnector()

    async def save_behavior(self, behavior_data: dict) -> str:
        try:
            behavior_data['created_at'] = datetime.utcnow()
            behavior_data['updated_at'] = datetime.utcnow()
            
            result = self.db.behaviors.insert_one(behavior_data)
            logger.info(f"Saved behavior with ID: {result.inserted_id}")
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Error saving behavior: {str(e)}")
            raise

    async def get_behavior(self, behavior_id: str) -> dict:
        try:
            behavior = self.db.behaviors.find_one({"_id": self.db.to_object_id(behavior_id)})
            return self.db.format_id(behavior)
            
        except Exception as e:
            logger.error(f"Error retrieving behavior: {str(e)}")
            raise

    async def list_behaviors(self) -> List[Dict[str, Any]]:
        try:
            behaviors = []
            cursor = self.db.behaviors.find().sort('created_at', -1)
            for behavior in cursor:
                behaviors.append(self.db.format_id(behavior))
            return behaviors
            
        except Exception as e:
            logger.error(f"Error listing behaviors: {str(e)}")
            raise

    async def update_behavior(self, behavior_id: str, updates: dict) -> bool:
        try:
            updates['updated_at'] = datetime.utcnow()
            
            result = self.db.behaviors.update_one(
                {"_id": self.db.to_object_id(behavior_id)},
                {"$set": updates}
            )
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating behavior: {str(e)}")
            raise

    async def delete_behavior(self, behavior_id: str) -> bool:
        try:
            result = self.db.behaviors.delete_one({"_id": self.db.to_object_id(behavior_id)})
            logger.info(f"Deleted behavior {behavior_id}: {result.deleted_count} document(s) deleted")
            return result.deleted_count > 0
            
        except Exception as e:
            logger.error(f"Error deleting behavior: {str(e)}")
            raise
