# game_server/data/db_connector.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import logging
from typing import Optional
from bson import ObjectId

load_dotenv()
logger = logging.getLogger(__name__)

class DatabaseConnector:

    # def __new__(cls):
    #     if cls._instance is None:
    #         cls._instance = super().__new__(cls)
    #     return cls._instance

    def __init__(self):
        if not hasattr(self, 'client'):
            self.client = MongoClient(os.getenv('MONGODB_URI'))
            self.db = self.client.agent_game
            self.behaviors = self.db.behaviors
            self.configs = self.db.configs
            self.users = self.db.users  # Add users collection

    @staticmethod
    def format_id(doc: dict) -> dict:
        if doc and '_id' in doc:
            doc['_id'] = str(doc['_id'])
        return doc

    @staticmethod
    def to_object_id(id_str: str) -> ObjectId:
        try:
            return ObjectId(id_str)
        except Exception as e:
            logger.error(f"Invalid ObjectId format: {id_str}")
            raise ValueError(f"Invalid ID format: {id_str}")