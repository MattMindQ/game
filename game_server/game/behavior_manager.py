# game/behavior_manager.py

from typing import Dict, List, Optional, Type
from loguru import logger
from .behaviors import BaseBehavior, BehaviorType, WanderBehavior

class BehaviorManager:
    """Manages custom behaviors and behavior registration"""
    
    def __init__(self):
        self.custom_behaviors: Dict[str, str] = {}  # behavior_id -> code
        self.compiled_behaviors: Dict[str, Type[BaseBehavior]] = {}  # Cache for compiled behaviors
        
    def get_available_behaviors(self) -> List[Dict[str, str]]:
        """Get all available behaviors including built-in and custom"""
        behaviors = [
            {
                "id": behavior_type.name.lower(),
                "name": behavior_type.name.replace("_", " ").title(),
                "type": "default"
            }
            for behavior_type in BehaviorType
        ]
        
        # Add custom behaviors
        for behavior_id, code in self.custom_behaviors.items():
            behaviors.append({
                "id": behavior_id,
                "name": f"Custom Behavior {behavior_id}",
                "type": "custom",
                "code": code
            })
            
        return behaviors

    def add_custom_behavior(self, behavior_id: str, behavior_code: str) -> bool:
        """Add or update a custom behavior"""
        try:
            # Validate behavior code
            if self._validate_behavior_code(behavior_code):
                self.custom_behaviors[behavior_id] = behavior_code
                # Clear cached compilation if exists
                self.compiled_behaviors.pop(behavior_id, None)
                logger.info(f"Custom behavior {behavior_id} added/updated")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to add behavior {behavior_id}: {e}")
            return False

    def get_behavior_instance(self, behavior_id: str) -> Optional[BaseBehavior]:
        """Get an instance of a behavior by ID"""
        try:
            # Check if it's a built-in behavior
            try:
                behavior_type = BehaviorType[behavior_id.upper()]
                return behavior_type.value()
            except KeyError:
                pass
            
            # Check if it's a custom behavior
            if behavior_id in self.custom_behaviors:
                # Use cached compiled behavior if available
                if behavior_id not in self.compiled_behaviors:
                    behavior_class = self._compile_behavior_code(self.custom_behaviors[behavior_id])
                    self.compiled_behaviors[behavior_id] = behavior_class
                
                return self.compiled_behaviors[behavior_id]()
            
            return None
        except Exception as e:
            logger.error(f"Error getting behavior instance for {behavior_id}: {e}")
            return WanderBehavior()  # Safe fallback

    def _validate_behavior_code(self, behavior_code: str) -> bool:
        """Validate custom behavior code"""
        try:
            # Simple compilation test
            compiled = compile(behavior_code, '<string>', 'exec')
            # Additional validation could be added here
            return True
        except Exception as e:
            logger.error(f"Invalid behavior code: {e}")
            return False

    def _compile_behavior_code(self, behavior_code: str) -> Type[BaseBehavior]:
        """Compile custom behavior code"""
        try:
            # Create namespace for compilation
            namespace = {
                'BaseBehavior': BaseBehavior,
                'Vector2D': Vector2D,
                'BehaviorContext': BehaviorContext
            }
            
            # Execute the code in our namespace
            exec(behavior_code, namespace)
            
            # Get the CustomBehavior class
            if 'CustomBehavior' not in namespace:
                raise ValueError("Custom behavior must define 'CustomBehavior' class")
            
            behavior_class = namespace['CustomBehavior']
            
            # Validate it's a proper behavior
            if not issubclass(behavior_class, BaseBehavior):
                raise ValueError("CustomBehavior must inherit from BaseBehavior")
            
            return behavior_class
            
        except Exception as e:
            logger.error(f"Error compiling behavior code: {e}")
            raise