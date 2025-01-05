# tests/test_components.py
import pytest
from uuid import UUID
from game_server.game.utils.vector import Vector2D
from game_server.game.components.physics import PhysicsComponent, PhysicsComponentFactory
from game_server.game.components.combat import CombatComponent, CombatComponentFactory
from game_server.game.components.movement import MovementComponent, MovementComponentFactory
from game_server.game.state.registry import TypedStateRegistry
from game_server.game.core.component_manager import ComponentManager

# Vector2D Tests
def test_vector_operations():
    v1 = Vector2D(1, 2)
    v2 = Vector2D(2, 3)
    
    # Test addition
    result = v1 + v2
    assert result.x == 3
    assert result.y == 5
    
    # Test subtraction
    result = v2 - v1
    assert result.x == 1
    assert result.y == 1
    
    # Test scalar multiplication
    result = v1 * 2
    assert result.x == 2
    assert result.y == 4
    
    # Test magnitude
    v = Vector2D(3, 4)
    assert v.magnitude() == 5
    
    # Test normalization
    normalized = v.normalize()
    assert pytest.approx(normalized.magnitude()) == 1

# Component Tests
# tests/test_components.py

def test_physics_component():
    # Create movement stats first
    movement = MovementComponentFactory.create(max_speed=3.0)
    
    # Then create physics with movement stats
    physics = PhysicsComponentFactory.create(
        position=Vector2D(0, 0),
        movement_stats=movement
    )
    
    assert isinstance(physics.component_id, UUID)
    assert physics.position.x == 0
    assert physics.position.y == 0
    
    # Test force application
    physics.apply_force(Vector2D(1, 1))
    physics.update(1.0)
    
    # Verify velocity changes
    assert physics.velocity.x > 0
    assert physics.velocity.y > 0
    assert physics.velocity.magnitude() <= movement.max_speed

def test_component_integration():
    state_registry = TypedStateRegistry()
    manager = ComponentManager(state_registry)
    
    # Create movement component first
    movement = MovementComponentFactory.create(max_speed=3.0)
    
    # Create physics with movement
    physics = PhysicsComponentFactory.create(
        position=Vector2D(0, 0),
        movement_stats=movement
    )
    
    combat = CombatComponentFactory.create(attack_damage=15)
    
    # Register components
    manager.register_component(movement)
    manager.register_component(physics)
    manager.register_component(combat)
    
    # Test system update
    manager.update_all(1.0)
    
    # Verify system state
    assert physics.velocity.magnitude() <= movement.max_speed

def test_combat_component():
    combat = CombatComponentFactory.create(attack_damage=15)
    
    assert isinstance(combat.component_id, UUID)
    assert combat.health == 100
    assert combat.attack_damage == 15
    
    # Test damage application
    was_fatal = combat.take_damage(30)
    assert not was_fatal
    assert combat.health == 70
    assert combat.get_health_percentage() == 70

def test_movement_component():
    movement = MovementComponentFactory.create(max_speed=3.0)
    
    assert isinstance(movement.component_id, UUID)
    assert movement.max_speed == 3.0
    
    # Test position clamping
    position = Vector2D(10, 10)
    bounds = (0, 0, 5, 5)
    clamped = movement.clamp_position(position, bounds)
    assert clamped.x == 5
    assert clamped.y == 5

# Component Manager Tests
def test_component_manager():
    state_registry = TypedStateRegistry()
    manager = ComponentManager(state_registry)
    
    # Create components
    physics = PhysicsComponentFactory.create(
        position=Vector2D(0, 0),
        movement_stats=MovementComponentFactory.create()
    )
    
    # Register component
    manager.register_component(physics)
    
    # Retrieve component
    retrieved = manager.get_component(physics.component_id)
    assert retrieved is not None
    assert retrieved.component_id == physics.component_id

