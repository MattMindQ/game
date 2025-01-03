# game_server/game/state/combat_state.py

import time
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from loguru import logger

from ..models import Agent, DeadAgent, GameStats

@dataclass
class CombatState:
    def __init__(self):
        self.stats = GameStats()
        self.dead_agents: List[DeadAgent] = []
        self.recent_kills: List[Dict[str, Any]] = []

    def resolve_combat(self, agents: List[Agent]) -> Tuple[List[str], List[Dict[str, Any]]]:
        """
        Resolve combat for all agents
        Returns: Tuple of (agents to remove, kill events)
        """
        agents_to_remove = []
        kill_events = []

        for agent in agents:
            if not agent.combat.is_alive():
                killer_team = None
                if agent.target_id:
                    killer = next((a for a in agents if a.id == agent.target_id), None)
                    if killer:
                        killer_team = killer.team
                
                # Record kill event
                kill_events.append({
                    "victim_id": agent.id,
                    "victim_team": agent.team,
                    "killer_team": killer_team
                })
                
                agents_to_remove.append(agent.id)

        return agents_to_remove, kill_events

    def handle_agent_death(self, agent: Agent, killer_team: Optional[str] = None) -> None:
        """Handle agent death and update statistics"""
        try:
            # Create dead agent record
            dead_agent = DeadAgent(
                id=agent.id,
                team=agent.team,
                killer_team=killer_team,
                lifetime=time.time() - agent.combat.last_attack_time
            )
            self.dead_agents.append(dead_agent)
            
            # Update team statistics
            if agent.team == "red":
                self.stats.red_agents -= 1
                if killer_team == "blue":
                    self.stats.blue_kills += 1
            else:
                self.stats.blue_agents -= 1
                if killer_team == "red":
                    self.stats.red_kills += 1
                    
            self.stats.total_deaths += 1
            
            # Record recent kill
            self.recent_kills.append({
                "victim_id": agent.id,
                "victim_team": agent.team,
                "killer_team": killer_team
            })
            
            logger.info(f"Handled death of agent {agent.id} (killed by team {killer_team})")
            
        except Exception as e:
            logger.error(f"Error handling agent death: {e}")
            raise

    def clear_recent_kills(self) -> None:
        """Clear recent kills list"""
        self.recent_kills = []

    def get_state(self) -> Dict[str, Any]:
        """Get current combat state"""
        return {
            "stats": self.stats.to_dict(),
            "recent_kills": self.recent_kills.copy() if self.recent_kills else []
        }

    def update_team_count(self, team: str, delta: int) -> None:
        """Update team count statistics"""
        if team == "red":
            self.stats.red_agents += delta
        else:
            self.stats.blue_agents += delta