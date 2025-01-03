from enum import Enum, auto
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, NamedTuple
from .vector import Vector2D
import math
import random
from loguru import logger

# Forward reference for type hints
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .models import Agent

class BehaviorType(Enum):
    WANDER = auto()
    WANDER_TOGETHER = auto()
    ATTACK = auto()
    FLEE = auto()

class ZoneType(Enum):
    """Extensible zone types"""
    VISUAL = "visual"
    RECOGNITION = "recognition"
    COMBAT = "combat"
    
    @classmethod
    def add_zone(cls, name: str) -> 'ZoneType':
        """Dynamically add new zone type"""
        return Enum(cls.__name__, {name.upper(): name})

class Zone(NamedTuple):
    """Zone configuration"""
    type: ZoneType
    range: float
    priority: int  # Lower number = higher priority

@dataclass
class AwarenessSystem:
    """Manages different awareness zones"""
    zones: Dict[ZoneType, Zone] = field(default_factory=dict)
    
    def __post_init__(self):
        if not self.zones:
            # Default zones if none provided
            self.zones = {
                ZoneType.VISUAL: Zone(ZoneType.VISUAL, 150.0, 1),
                ZoneType.RECOGNITION: Zone(ZoneType.RECOGNITION, 100.0, 2),
                ZoneType.COMBAT: Zone(ZoneType.COMBAT, 30.0, 3)
            }
    
    def add_zone(self, zone_type: ZoneType, range: float, priority: int):
        """Add or update a zone"""
        self.zones[zone_type] = Zone(zone_type, range, priority)
    
    def get_agents_by_zone(self, agent: 'Agent', all_agents: List['Agent']) -> Dict[ZoneType, List['Agent']]:
        """Categorize agents by zones they are in"""
        result = {zone_type: [] for zone_type in self.zones.keys()}
        
        for other in all_agents:
            if other.id == agent.id:
                continue
                
            distance = (other.position - agent.position).magnitude()
            
            # Add to all applicable zones
            for zone_type, zone in self.zones.items():
                if distance <= zone.range:
                    result[zone_type].append(other)
        
        return result

@dataclass
class BehaviorContext:
    """Enhanced context with zone awareness"""
    agent: 'Agent'
    agents_by_zone: Dict[ZoneType, List['Agent']]
    current_behavior: BehaviorType
    time_in_behavior: float
    
    def get_agents_in_zone(self, zone_type: ZoneType, team_filter: Optional[str] = None) -> List['Agent']:
        """Get agents in specific zone with optional team filtering"""
        agents = self.agents_by_zone.get(zone_type, [])
        if team_filter is not None:
            return [a for a in agents if a.team == team_filter]
        return agents
    
    def get_enemies_in_zone(self, zone_type: ZoneType) -> List['Agent']:
        """Get enemies in specific zone"""
        return [a for a in self.agents_by_zone.get(zone_type, []) 
                if a.team != self.agent.team]
    
    def get_allies_in_zone(self, zone_type: ZoneType) -> List['Agent']:
        """Get allies in specific zone"""
        return [a for a in self.agents_by_zone.get(zone_type, []) 
                if a.team == self.agent.team]
    
    @property
    def health_percentage(self) -> float:
        return self.agent.combat.get_health_percentage()
    
    @property
    def is_outnumbered(self) -> bool:
        enemies = self.get_enemies_in_zone(ZoneType.RECOGNITION)
        allies = self.get_allies_in_zone(ZoneType.RECOGNITION)
        return len(enemies) > len(allies) + 1
    
    @property
    def has_low_health(self) -> bool:
        return self.health_percentage < 30
    
    @property
    def has_allies_nearby(self) -> bool:
        return len(self.get_allies_in_zone(ZoneType.RECOGNITION)) > 0
    
    @property
    def can_engage_combat(self) -> bool:
        return len(self.get_enemies_in_zone(ZoneType.COMBAT)) > 0
    
    @property
    def should_pursue(self) -> bool:
        return (len(self.get_enemies_in_zone(ZoneType.VISUAL)) > 0 and 
                not self.can_engage_combat and 
                self.health_percentage > 50)

class BaseBehavior:
    """Base class for all behaviors"""
    def execute(self, context: BehaviorContext) -> Vector2D:
        raise NotImplementedError

class WanderBehavior(BaseBehavior):
    def execute(self, context: BehaviorContext) -> Vector2D:
        agent = context.agent
        angle = agent.wander_angle + random.uniform(-0.3, 0.3)
        agent.wander_angle = angle
        
        return Vector2D(
            math.cos(angle) * agent.movement.max_force,
            math.sin(angle) * agent.movement.max_force
        )

class WanderTogetherBehavior(BaseBehavior):
    def execute(self, context: BehaviorContext) -> Vector2D:
        agent = context.agent
        allies = context.get_allies_in_zone(ZoneType.RECOGNITION)
        
        if not allies:
            return WanderBehavior().execute(context)
        
        # Calculate center of nearby allies
        center = Vector2D(0, 0)
        for ally in allies:
            center = center + ally.position
        center = center * (1.0 / len(allies))
        
        # Combine center attraction with wandering
        to_center = (center - agent.position).normalize() * agent.movement.max_force * 0.5
        wander = WanderBehavior().execute(context) * 0.5
        return to_center + wander

class AttackBehavior(BaseBehavior):
    def execute(self, context: BehaviorContext) -> Vector2D:
        agent = context.agent
        
        # Check combat zone first
        combat_enemies = context.get_enemies_in_zone(ZoneType.COMBAT)
        if combat_enemies:
            target = min(combat_enemies, 
                        key=lambda e: (e.position - agent.position).magnitude())
            agent.target_id = target.id
            return self._calculate_attack_force(agent, target)
        
        # If no combat targets, check visual range for pursuit
        visual_enemies = context.get_enemies_in_zone(ZoneType.VISUAL)
        if visual_enemies and context.should_pursue:
            target = min(visual_enemies,
                        key=lambda e: (e.position - agent.position).magnitude())
            agent.target_id = target.id
            return self._calculate_pursuit_force(agent, target)
        
        return Vector2D(0, 0)
    
    def _calculate_attack_force(self, agent: 'Agent', target: 'Agent') -> Vector2D:
        to_target = target.position - agent.position
        ideal_distance = agent.combat.attack_range * 0.8
        
        if to_target.magnitude() > ideal_distance:
            return to_target.normalize() * agent.movement.max_force
        return Vector2D(0, 0)
    
    def _calculate_pursuit_force(self, agent: 'Agent', target: 'Agent') -> Vector2D:
        to_target = target.position - agent.position
        return to_target.normalize() * agent.movement.max_force * 1.2

class FleeBehavior(BaseBehavior):
    def execute(self, context: BehaviorContext) -> Vector2D:
        agent = context.agent
        enemies = context.get_enemies_in_zone(ZoneType.VISUAL)
        
        if not enemies:
            return Vector2D(0, 0)
        
        # Calculate center of threat
        danger_center = Vector2D(0, 0)
        for enemy in enemies:
            danger_center = danger_center + enemy.position
        danger_center = danger_center * (1.0 / len(enemies))
        
        flee_direction = (agent.position - danger_center).normalize()
        return flee_direction * agent.movement.max_force

class DecisionMaker:
    def __init__(self):
        self.behaviors = {
            BehaviorType.WANDER: WanderBehavior(),
            BehaviorType.WANDER_TOGETHER: WanderTogetherBehavior(),
            BehaviorType.ATTACK: AttackBehavior(),
            BehaviorType.FLEE: FleeBehavior()
        }
    
    def evaluate(self, context: BehaviorContext) -> BehaviorType:
        """Determine which behavior to use based on context"""
        
        # Priority 1: Survival
        if context.has_low_health or (context.is_outnumbered and context.health_percentage < 70):
            return BehaviorType.FLEE
        
        # Priority 2: Combat
        if context.get_enemies_in_zone(ZoneType.VISUAL) and not context.has_low_health:
            if not context.is_outnumbered or context.has_allies_nearby:
                return BehaviorType.ATTACK
        
        # Priority 3: Group behavior
        if context.has_allies_nearby and not context.get_enemies_in_zone(ZoneType.VISUAL):
            return BehaviorType.WANDER_TOGETHER
        
        # Default behavior
        return BehaviorType.WANDER
    
    def get_behavior(self, behavior_type: BehaviorType) -> BaseBehavior:
        return self.behaviors[behavior_type]

class BehaviorSystem:
    def __init__(self):
        self.decision_maker = DecisionMaker()
        self.current_behaviors: Dict[str, BehaviorType] = {}
        self.behavior_timers: Dict[str, float] = {}
        self.awareness = AwarenessSystem()
    
    def add_zone(self, zone_type: ZoneType, range: float, priority: int):
        """Add or update an awareness zone"""
        self.awareness.add_zone(zone_type, range, priority)
    
    def update(self, agent: 'Agent', nearby_agents: List['Agent']) -> Vector2D:
        """Main update method for behavior system"""
        try:
            # Get agents categorized by zones
            agents_by_zone = self.awareness.get_agents_by_zone(agent, nearby_agents)
            
            # Prepare enhanced context
            context = BehaviorContext(
                agent=agent,
                agents_by_zone=agents_by_zone,
                current_behavior=self.current_behaviors.get(agent.id, BehaviorType.WANDER),
                time_in_behavior=self.behavior_timers.get(agent.id, 0)
            )
            
            # Get appropriate behavior
            new_behavior = self.decision_maker.evaluate(context)
            
            # Update behavior tracking
            if new_behavior != self.current_behaviors.get(agent.id):
                self.current_behaviors[agent.id] = new_behavior
                self.behavior_timers[agent.id] = 0
                logger.info(f"Agent {agent.id} changing behavior to {new_behavior.name}")
            
            # Execute behavior with context
            behavior = self.decision_maker.get_behavior(new_behavior)
            force = behavior.execute(context)
            
            # Update timer
            self.behavior_timers[agent.id] = self.behavior_timers.get(agent.id, 0) + 1
            
            return force
            
        except Exception as e:
            logger.error(f"Error in behavior system: {e}")
            return Vector2D(0, 0)  # Safe default