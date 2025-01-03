# game_server/game/state.py

import math
import time
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from loguru import logger

from .models import Agent, DeadAgent, GameStats
from .behaviors import BehaviorType
from data.config_service import ConfigService
from data.user_service import UserService
from .world.world import World
from .world.wall import Wall
from .vector import Vector2D
from .physics.collision import CollisionInfo, circle_wall_collision, resolve_collision
import random

GAME_BOUNDS = (0, 0, 800, 600)

@dataclass
class GameState:
    def __init__(self):
        # Core state
        self.agents: Dict[str, Agent] = {}
        self.is_running: bool = False
        self.dead_agents: List[DeadAgent] = []
        self.stats = GameStats()
        self.recent_kills: List[Dict[str, Any]] = []
        
        # World setup
        self.world = World()
        self.world.generate_world(
            world_width=GAME_BOUNDS[2],
            world_height=GAME_BOUNDS[3],
            num_walls=5
        )
        
        # Services
        self.user_service = UserService()
        self.config_service = ConfigService()
        self.default_user = None
        self.active_user_id = None
        self.active_config = None

        # Initialize
        self.initialize_user()
        self.initialize_config()
        
    def get_random_position(self) -> Vector2D:
        """Generate a valid random position away from walls"""
        for _ in range(100):  # Maximum attempts
            pos = Vector2D(
                random.uniform(GAME_BOUNDS[0] + 20, GAME_BOUNDS[2] - 20),
                random.uniform(GAME_BOUNDS[1] + 20, GAME_BOUNDS[3] - 20)
            )
            if not self.world.check_collision_with_walls(pos.x, pos.y):
                return pos
                
        # Fallback to center position
        return Vector2D(
            (GAME_BOUNDS[0] + GAME_BOUNDS[2]) / 2,
            (GAME_BOUNDS[1] + GAME_BOUNDS[3]) / 2
        )

    async def initialize_config(self):
        try:
            self.active_config = await self.config_service.get_default_config()
            if not self.active_config:
                logger.warning("No default config found")
        except Exception as e:
            logger.error(f"Error initializing config: {e}")

    async def initialize_user(self):
        try:
            self.default_user = await self.user_service.get_or_create_default_user()
            self.active_user_id = self.default_user['_id']
            logger.info(f"Initialized with default user: {self.active_user_id}")
        except Exception as e:
            logger.error(f"Error initializing user: {e}")

    async def load_config(self, config_id: str) -> bool:
        try:
            config = await self.config_service.get_config(config_id)
            if config:
                if config.get('is_default') or config.get('user_id') == self.active_user_id:
                    self.active_config = config
                    self.apply_config()
                    return True
            return False
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return False

    def apply_config(self):
        if not self.active_config:
            return

        params = self.active_config.get('parameters', {})
        
        for agent in self.agents.values():
            agent.combat.max_health = params.get('baseHealth', 100)
            agent.combat.damage = params.get('baseDamage', 10)
            agent.movement.speed = params.get('baseSpeed', 5)
            agent.movement.turn_speed = params.get('turnSpeed', 0.1)

        Agent.VISUAL_RANGE = params.get('visualRange', 150)
        Agent.RECOGNITION_RANGE = params.get('recognitionRange', 100)
        Agent.COMBAT_RANGE = params.get('combatRange', 30)

    def add_agent(self, team: str) -> str:
        """Add a new agent to the game"""
        try:
            # Get valid spawn position
            spawn_position = self.get_random_position()
            
            # Create agent with position and world reference
            agent = Agent(
                team=team,
                position=spawn_position,
                world=self.world,  # Pass world reference
                bounds=GAME_BOUNDS
            )
            
            self.agents[agent.id] = agent
            
            # Update stats
            if team == "red":
                self.stats.red_agents += 1
            else:
                self.stats.blue_agents += 1
                
            logger.info(f"Added new agent {agent.id} to team {team}")
            return agent.id
            
        except Exception as e:
            logger.error(f"Error adding agent: {e}")
            raise

    def remove_agent(self, agent_id: str, killer_team: Optional[str] = None):
        """Remove an agent and update statistics"""
        if agent_id in self.agents:
            agent = self.agents[agent_id]
            try:
                dead_agent = DeadAgent(
                    id=agent.id,
                    team=agent.team,
                    killer_team=killer_team,
                    lifetime=time.time() - agent.combat.last_attack_time
                )
                self.dead_agents.append(dead_agent)
                
                if agent.team == "red":
                    self.stats.red_agents -= 1
                    if killer_team == "blue":
                        self.stats.blue_kills += 1
                else:
                    self.stats.blue_agents -= 1
                    if killer_team == "red":
                        self.stats.red_kills += 1
                        
                self.stats.total_deaths += 1
                self.recent_kills.append({
                    "victim_id": agent.id,
                    "victim_team": agent.team,
                    "killer_team": killer_team
                })
                
                del self.agents[agent_id]
                logger.info(f"Removed agent {agent_id} (killed by team {killer_team})")
                
            except Exception as e:
                logger.error(f"Error removing agent {agent_id}: {e}")
                raise

    def update(self) -> Dict[str, Any]:
        """Main update loop"""
        if not self.is_running:
            return {
                "timestamp": int(time.time() * 1000),
                "agents": [],
                "stats": self.stats.to_dict()
            }
            
        try:
            self.recent_kills = []
            agents_list = list(self.agents.values())
            updated_agents = []
            
            # 1. Behavior Update
            for agent in agents_list:
                agent.update_behavior(agents_list)  # Only update behavior decisions

            # 2. Physics Update
            self._update_physics(agents_list)

            # 3. Combat Resolution
            for agent in agents_list:
                if not agent.combat.is_alive():
                    killer_team = None
                    if agent.target_id:
                        killer = next((a for a in agents_list if a.id == agent.target_id), None)
                        if killer:
                            killer_team = killer.team
                    self.remove_agent(agent.id, killer_team)
                else:
                    updated_agents.append(agent.to_dict())
                    
            state_update = {
                "timestamp": int(time.time() * 1000),
                "agents": updated_agents,
                "stats": self.stats.to_dict(),
                "world": self.get_world_state()
            }
            
            if self.recent_kills:
                state_update["recent_kills"] = self.recent_kills
                
            return state_update
            
        except Exception as e:
            logger.error(f"Error updating game state: {e}")
            raise

    def _update_physics(self, agents: List[Agent]):
        """Update physics and handle collisions"""
        # Store original positions
        original_positions: Dict[str, Tuple[Vector2D, Vector2D]] = {
            agent.id: (
                Vector2D(agent.position.x, agent.position.y),
                Vector2D(agent.velocity.x, agent.velocity.y)
            )
            for agent in agents
        }

        # Update positions
        for agent in agents:
            agent.physics.update(agent.movement)

        # Check and resolve collisions
        for agent in agents:
            collision = self.world.check_collisions(
                agent.position,
                agent.physics.radius
            )
            
            if collision and collision.is_colliding:
                # Restore previous position
                orig_pos, orig_vel = original_positions[agent.id]
                # Resolve collision
                new_pos, new_vel = resolve_collision(
                    position=orig_pos,
                    velocity=orig_vel,
                    collision=collision
                )
                # Update agent
                agent.position = new_pos
                agent.velocity = new_vel

    def get_world_state(self) -> Dict[str, Any]:
        """Get current world state for serialization"""
        return {
            "walls": [
                {
                    "name": wall.name,
                    "x": wall.position.x,
                    "y": wall.position.y,
                    "width": wall.width,
                    "height": wall.height
                }
                for wall in self.world.walls
            ],
            "bounds": GAME_BOUNDS,
            "holes": [],
            "colines": []
        }

    def get_state_update(self) -> Dict[str, Any]:
        """Get full state update"""
        state = {
            "is_running": self.is_running,
            "team_counts": {
                "red": self.stats.red_agents,
                "blue": self.stats.blue_agents
            },
            "stats": self.stats.to_dict(),
            "timestamp": int(time.time() * 1000),
            "world": self.get_world_state()
        }
        
        if self.active_config:
            state["config"] = {
                "id": self.active_config.get('_id'),
                "name": self.active_config.get('name'),
                "parameters": self.active_config.get('parameters', {})
            }
        else:
            state["config"] = None
            
        state["user"] = {
            "id": self.active_user_id,
            "is_default": self.default_user is not None and self.active_user_id == self.default_user['_id']
        }

        return state

    def add_wall(self, x: float, y: float, width: float, height: float, name: str = "Wall"):
        """Add a new wall to the world"""
        wall = Wall(position=Vector2D(x, y), width=width, height=height, name=name)
        self.world.add_wall(wall)
        logger.info(f"Added wall '{name}' at ({x}, {y}), size ({width}x{height})")

    def get_team_count(self, team: str) -> int:
        """Get current count of agents for a team"""
        return sum(1 for agent in self.agents.values() if agent.team == team)
    
    def toggle_game_state(self) -> bool:
        """Toggle game running state"""
        try:
            self.is_running = not self.is_running
            logger.info(f"Game state toggled to: {'running' if self.is_running else 'stopped'}")
            return self.is_running
        except Exception as e:
            logger.error(f"Error toggling game state: {e}")
            raise
        
    def force_behavior(self, agent_id: str, behavior_type: BehaviorType) -> bool:
        """Force a specific behavior for an agent"""
        try:
            if agent_id in self.agents:
                agent = self.agents[agent_id]
                agent.behavior_system.current_behaviors[agent.id] = behavior_type
                agent.current_behavior = behavior_type.name
                logger.info(f"Forced behavior {behavior_type.name} for agent {agent_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error forcing behavior for agent {agent_id}: {e}")
            return False