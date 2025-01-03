# game_server/game/behavior_manager.py
import ast
from typing import Dict, Any, List, Optional
from loguru import logger

class BehaviorValidator:
    @staticmethod
    def validate_ast(code: str) -> bool:
        """Validate the Python code syntax and structure"""
        try:
            # Parse the code
            tree = ast.parse(code)
            
            # Check for required function
            has_update = False
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef) and node.name == 'update':
                    has_update = True
                    # Validate function parameters
                    if len(node.args.args) != 2:
                        logger.error("update function must have exactly 2 parameters (agent, nearby_agents)")
                        return False
            
            if not has_update:
                logger.error("Code must contain an 'update' function")
                return False
                
            return True
            
        except SyntaxError as e:
            logger.error(f"Syntax error in code: {e}")
            return False
        except Exception as e:
            logger.error(f"Error validating code: {e}")
            return False

class CustomBehavior:
    def __init__(self, code: str):
        self.code = code
        self.compiled = None
        self.globals = {}
        
    def compile(self) -> bool:
        """Compile the behavior code"""
        try:
            self.compiled = compile(self.code, '<string>', 'exec')
            return True
        except Exception as e:
            logger.error(f"Error compiling behavior: {e}")
            return False
            
    def execute(self, agent: Any, nearby_agents: List[Any]) -> Dict[str, Any]:
        """Execute the behavior code"""
        try:
            # Create a fresh globals dict with only necessary items
            exec_globals = {
                'agent': agent,
                'nearby_agents': nearby_agents,
            }
            
            # Execute the code
            exec(self.compiled, exec_globals)
            
            # Call the update function
            if 'update' in exec_globals:
                result = exec_globals['update'](agent, nearby_agents)
                return result if result is not None else {}
            else:
                logger.error("No update function found in compiled code")
                return {}
                
        except Exception as e:
            logger.error(f"Error executing behavior: {e}")
            return {}

class BehaviorManager:
    def __init__(self):
        self.behaviors: Dict[str, CustomBehavior] = {}
        self.validator = BehaviorValidator()
        
    def add_behavior(self, agent_id: str, code: str) -> bool:
        """Add or update a custom behavior for an agent"""
        try:
            # Validate code
            if not self.validator.validate_ast(code):
                return False
                
            # Create and compile behavior
            behavior = CustomBehavior(code)
            if not behavior.compile():
                return False
                
            # Store behavior
            self.behaviors[agent_id] = behavior
            logger.info(f"Added custom behavior for agent {agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding behavior: {e}")
            return False
            
    def get_behavior(self, agent_id: str) -> Optional[CustomBehavior]:
        """Get custom behavior for an agent"""
        return self.behaviors.get(agent_id)
        
    def remove_behavior(self, agent_id: str) -> bool:
        """Remove custom behavior for an agent"""
        if agent_id in self.behaviors:
            del self.behaviors[agent_id]
            return True
        return False