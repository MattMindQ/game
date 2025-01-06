from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from uuid import UUID
from loguru import logger
import time

from .base_state import BaseState
from ..models.stats import GameStats
from ..models.common import DeadAgent

@dataclass
class CombatStateData:
    """Combat state data structure"""
    stats: GameStats
    dead_agents: List[DeadAgent] = field(default_factory=list)
    recent_kills: List[Dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert CombatStateData to a serializable dictionary"""
        return {
            "stats": self.stats.to_dict(),
            "dead_agents": [dead_agent.to_dict() for dead_agent in self.dead_agents],
            "recent_kills": self.recent_kills,
        }


class CombatState(BaseState[CombatStateData]):
    """Enhanced combat state with component-based architecture"""
    
    def __init__(self):
        initial_data = CombatStateData(
            stats=GameStats(),
            dead_agents=[],
            recent_kills=[]
        )
        super().__init__(initial_value=initial_data)
    
    def resolve_combat(self, agents: List['Agent']) -> Tuple[List[str], List[Dict[str, Any]]]:
        """Resolve combat for all agents"""
        try:
            agents_to_remove = []
            kill_events = []
            data = self.get_value()

            for agent in agents:
                if not agent.combat.is_alive():
                    killer_team = None
                    if agent.target_id:
                        killer = next((a for a in agents if a.id == agent.target_id), None)
                        if killer:
                            killer_team = killer.team
                    
                    kill_events.append({
                        "victim_id": agent.id,
                        "victim_team": agent.team,
                        "killer_team": killer_team
                    })
                    agents_to_remove.append(agent.id)

            return agents_to_remove, kill_events
            
        except Exception as e:
            logger.exception(f"Error resolving combat: {e}")
            raise
    
    def handle_agent_death(self, agent: 'Agent', killer_team: Optional[str] = None) -> None:
        """Handle agent death and update statistics"""
        try:
            data = self.get_value()
            
            # Create dead agent record
            dead_agent = DeadAgent(
                id=agent.id,
                team=agent.team,
                killer_team=killer_team,
                lifetime=time.time() - agent.combat.last_attack_time
            )
            data.dead_agents.append(dead_agent)
            
            # Update statistics
            if agent.team == "red":
                data.stats.red_agents -= 1
                if killer_team == "blue":
                    data.stats.blue_kills += 1
            else:
                data.stats.blue_agents -= 1
                if killer_team == "red":
                    data.stats.red_kills += 1
            
            data.stats.total_deaths += 1
            
            # Record kill
            data.recent_kills.append({
                "victim_id": agent.id,
                "victim_team": agent.team,
                "killer_team": killer_team
            })
            
            # Update state
            self.set_value(data)
            logger.info(f"Handled death of agent {agent.id} (killed by team {killer_team})")
            
        except Exception as e:
            logger.exception(f"Error handling agent death: {e}")
            raise
    
    def clear_recent_kills(self) -> None:
        """Clear recent kills list"""
        data = self.get_value()
        data.recent_kills = []
        self.set_value(data)
    
    def get_state(self) -> Dict[str, Any]:
        """Get serializable state"""
        return self.get_value().to_dict()
    
    def update_team_count(self, team: str, delta: int) -> None:
        """Update team count statistics"""
        data = self.get_value()
        if team == "red":
            data.stats.red_agents += delta
        else:
            data.stats.blue_agents += delta
        self.set_value(data)