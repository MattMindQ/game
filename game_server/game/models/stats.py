# game/models/stats.py
from dataclasses import dataclass, field
from typing import Dict, Optional, Any
import time

@dataclass
class GameStats:
    red_kills: int = 0
    blue_kills: int = 0
    red_agents: int = 0
    blue_agents: int = 0
    total_deaths: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "red_kills": self.red_kills,
            "blue_kills": self.blue_kills,
            "red_agents": self.red_agents,
            "blue_agents": self.blue_agents,
            "total_deaths": self.total_deaths,
        }

@dataclass
class DeadAgent:
    id: str
    team: str
    killer_team: Optional[str]
    lifetime: float
    death_time: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "team": self.team,
            "killer_team": self.killer_team,
            "lifetime": self.lifetime,
        }