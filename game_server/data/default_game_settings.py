# game_server/data/default_game_settings.py

from typing import Dict, Any

DEFAULT_GAME_CONFIG: Dict[str, Any] = {
    "is_default": True,
    "name": "Default Configuration",
    "parameters": {
        # Agent Parameters
        "baseHealth": 100,
        "baseDamage": 10,
        "baseSpeed": 5,
        "turnSpeed": 0.1,
        "attackRange": 50,
        "attackCooldown": 1.0,
        
        # World Parameters
        "worldWidth": 800,
        "worldHeight": 600,
        "numRandomWalls": 5,
        "minWallGap": 50,
        
        # Game Rules
        "teamSize": 5,
        "roundTime": 300,  # 5 minutes
        "spawnProtectionTime": 3.0,
        
        # Wall Generation
        "cornerWallMinSize": 60,
        "cornerWallMaxSize": 120,
        "randomWallMinSize": 40,
        "randomWallMaxSize": 80
    }
}

DEFAULT_USER: Dict[str, Any] = {
    "_id": "default_user",
    "name": "Default User",
    "is_default": True
}