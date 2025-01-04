class Agent:
    def __init__(self, team: str, position: Vector2D, world: World, bounds: Tuple[float, float, float, float]):
        self.id: str = str(uuid.uuid4())
        self.team: str = team
        self.world = world
        self.bounds = bounds
        
        # Core systems
        self.physics = Physics(
            position=position,
            velocity=Vector2D(random.uniform(-1, 1), random.uniform(-1, 1)),
            acceleration=Vector2D(0, 0),
            radius=10.0
        )
        
        self.combat = CombatStats(
            attack_damage=random.uniform(10, 20)
        )
        
        self.movement = MovementStats(
            max_speed=random.uniform(2, 4),
            max_force=0.5
        )
        
        # State tracking
        self.target_id: Optional[str] = None
        self.wander_angle: float = random.uniform(0, math.pi * 2)
        
        # Behavior system
        self.behavior_system = BehaviorSystem()
        self.current_behavior: Optional[str] = None

    @property
    def position(self) -> Vector2D:
        return self.physics.position
    
    @position.setter
    def position(self, value: Vector2D):
        self.physics.position = value
    
    @property
    def velocity(self) -> Vector2D:
        return self.physics.velocity
    
    @velocity.setter
    def velocity(self, value: Vector2D):
        self.physics.velocity = value

    def update_behavior(self, nearby_agents: List['Agent']) -> None:
        """Update only behavior decisions"""
        try:
            behavior_force = self.behavior_system.update(self, nearby_agents)
            self.physics.stored_force = behavior_force
            
            if self.target_id:
                target = next((a for a in nearby_agents if a.id == self.target_id), None)
                if target and self.combat.can_attack():
                    distance = (target.position - self.position).magnitude()
                    if distance <= self.combat.attack_range:
                        self.attack(target)
                        
        except Exception as e:
            logger.error(f"Error updating agent behavior {self.id}: {e}")

    def update_position(self) -> None:
        """Update position based on physics"""
        try:
            self.physics.update(self.movement)
        except Exception as e:
            logger.error(f"Error updating agent position {self.id}: {e}")

    def handle_combat(self, all_agents: List['Agent']) -> None:
        """Handle combat interactions"""
        try:
            if self.target_id:
                target = next((a for a in all_agents if a.id == self.target_id), None)
                if target and self.combat.can_attack():
                    distance = (target.position - self.position).magnitude()
                    if distance <= self.combat.attack_range:
                        self.attack(target)
        except Exception as e:
            logger.error(f"Error in combat handling for agent {self.id}: {e}")

    def attack(self, target: 'Agent') -> bool:
        """Perform attack on target"""
        try:
            if not self.combat.can_attack():
                return False
            
            self.combat.last_attack_time = time.time()
            was_fatal = target.combat.take_damage(self.combat.attack_damage)
            
            if was_fatal:
                logger.info(f"Agent {self.id} killed agent {target.id}")
                
            return was_fatal
            
        except Exception as e:
            logger.error(f"Error in attack from agent {self.id} to {target.id}: {e}")
            return False

    def to_dict(self) -> Dict[str, Any]:
        """Convert agent state to dictionary for serialization"""
        try:
            return {
                "id": self.id,
                "team": self.team,
                "position": {
                    "x": self.physics.position.x,
                    "y": self.physics.position.y
                },
                "health": self.combat.health,
                "target_id": self.target_id,
                "behavior": self.current_behavior
            }
        except Exception as e:
            logger.error(f"Error serializing agent {self.id}: {e}")
            return {
                "id": self.id,
                "error": str(e)
            }

    def __str__(self) -> str:
        return f"Agent(id={self.id[:8]}, team={self.team}, health={self.combat.health:.1f}%, behavior={self.current_behavior})"