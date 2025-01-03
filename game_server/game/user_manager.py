from loguru import logger
from data.user_service import UserService

class UserManager:
    def __init__(self, user_service: UserService):
        self.user_service = user_service
        self.default_user = None
        self.active_user_id = None

    async def initialize_user(self):
        try:
            self.default_user = await self.user_service.get_or_create_default_user()
            self.active_user_id = self.default_user['_id']
            logger.info(f"Initialized with default user: {self.active_user_id}")
        except Exception as e:
            logger.error(f"Error initializing user: {e}")

    def get_active_user(self) -> str:
        return self.active_user_id
