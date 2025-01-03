# game_server/llm/context_handler.py
from typing import Dict, Any
from loguru import logger

class LLMContextHandler:
    """Handles context-specific formatting for LLM queries"""
    
    @staticmethod
    def format_game_context(context: Dict[str, Any]) -> str:
        """Format game-specific context for LLM"""
        element_id = context.get('elementId', '')
        
        context_templates = {
            'gameControls': """
                Context: Game Control Panel
                Available Actions:
                - Start/Stop game
                - Reset simulation
                - Add agents (red/blue team)
                Current Configuration: {config}
            """,
            'agentDetails': """
                Context: Agent Details Panel
                Agent Information:
                - ID: {agent_id}
                - Team: {team}
                - Health: {health}
                - Current Behavior: {behavior}
                Available Data: Position, Combat Stats, Behavior State
            """,
            'codeEditor': """
                Context: Behavior Code Editor
                Purpose: Define agent behavior logic
                Available Functions:
                - update(agent, nearby_agents)
                Available Agent Properties:
                - position (x, y)
                - health
                - team
                - target_id
                Return Format: Dictionary of behavior weights
            """,
            'behaviorList': """
                Context: Behavior Management
                Features:
                - Save/Load behaviors
                - Modify existing behaviors
                - Apply behaviors to agents
                Current Behaviors: {behaviors}
            """
        }
        
        return context_templates.get(
            element_id,
            f"Context: {context.get('elementName', 'Unknown')}\nDescription: {context.get('description', '')}"
        )

    @staticmethod
    def should_generate_code(context: Dict[str, Any], query: str) -> bool:
        """Determine if code generation is needed based on context and query"""
        code_related_elements = {'codeEditor', 'behaviorList'}
        code_related_terms = {'code', 'behavior', 'script', 'program', 'function'}
        
        element_id = context.get('elementId', '').lower()
        query_words = set(query.lower().split())
        
        return (
            element_id in code_related_elements or
            any(term in query_words for term in code_related_terms)
        )

    @staticmethod
    def format_code_context(context: Dict[str, Any]) -> str:
        """Format context specifically for code generation"""
        return """
        Agent Behavior Code Requirements:
        1. Must implement update(agent, nearby_agents) function
        2. Return dictionary of behavior weights (0-1)
        3. Available weights:
           - cohesion: group movement
           - alignment: movement direction
           - separation: collision avoidance
           - wander: random movement
           - avoidWalls: boundary avoidance
           - pursue: chase enemies
           - flee: escape from danger
        4. Access to agent properties:
           - position: {x, y}
           - health: current health value
           - team: 'red' or 'blue'
           - target_id: current target if any
        """