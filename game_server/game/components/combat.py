# game_server/game/components/combat.py

from typing import Optional
from uuid import UUID, uuid4
from dataclasses import dataclass, field
import time
from ..core.base import IComponent

@dataclass
class CombatComponent(IComponent):
    # Optional fields with defaults
    component_id: UUID = field(default_factory=uuid4)
    max_health: float = 100
    health: float = 100
    attack_damage: float = 15
    attack_range: float = 30
    attack_cooldown: float = 1.0
    last_attack_time: float = field(default_factory=time.time)
    
    def initialize(self) -> None:
        """Initialize combat component"""
        self.health = self.max_health
        self.last_attack_time = time.time()
    
    def update(self, dt: float) -> None:
        """Update combat state"""
        pass  # Combat state updates are event-driven
    
    def cleanup(self) -> None:
        """Cleanup component resources"""
        pass
    
    def is_alive(self) -> bool:
        return self.health > 0
    
    def can_attack(self) -> bool:
        return time.time() - self.last_attack_time >= self.attack_cooldown
    
    def take_damage(self, damage: float) -> bool:
        """Apply damage and return True if fatal"""
        self.health = max(0, self.health - damage)
        return not self.is_alive()
    
    def get_health_percentage(self) -> float:
        return (self.health / self.max_health) * 100

class CombatComponentFactory:
    @classmethod
    def create(cls, attack_damage: float = 15) -> CombatComponent:
        return CombatComponent(attack_damage=attack_damage)