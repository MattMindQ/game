# game_server/game/models/stats.py
from dataclasses import dataclass, field
from typing import Dict, Any
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
class CombatStats:
    max_health: float = 100
    health: float = 100
    attack_damage: float = 15
    attack_range: float = 30
    attack_cooldown: float = 1.0
    last_attack_time: float = field(default_factory=time.time)
    
    def is_alive(self) -> bool:
        return self.health > 0
    
    def can_attack(self) -> bool:
        return time.time() - self.last_attack_time >= self.attack_cooldown
    
    def take_damage(self, damage: float) -> bool:
        self.health = max(0, self.health - damage)
        return not self.is_alive()
    
    def get_health_percentage(self) -> float:
        return (self.health / self.max_health) * 100

@dataclass
class MovementStats:
    max_speed: float = 3.0
    max_force: float = 0.5
    awareness_radius: float = 100
    perception_radius: float = 50