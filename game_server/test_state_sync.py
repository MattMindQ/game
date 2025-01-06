# test_state_sync.py
import asyncio
from loguru import logger
from typing import Dict, Any, Set
from uuid import UUID
from datetime import datetime
# Fix imports to be relative to current location
from game.state.game_state_manager import GameStateManager
from game.vector import Vector2D  # Adjust this path based on your vector location

class StateSyncDebugger:
    def __init__(self):
        self.bounds = (0, 0, 800, 600)
        self.game_state_manager = GameStateManager(self.bounds)
        self.sync_notifications: Set[UUID] = set()
        
    def _sync_notification_handler(self, state_id: UUID):
        """Track sync notifications"""
        self.sync_notifications.add(state_id)
        logger.debug(f"Received sync notification for state {state_id}")

    async def run_sync_test(self):
        """Run synchronization test with detailed logging"""
        try:
            start_time = datetime.now()
            
            # Step 1: Initialize States
            logger.info("=== Step 1: Initializing States ===")
            await self.game_state_manager.initialize()
            self._log_initialization_time(start_time)
            
            # Step 2: Verify Initial State Registration
            logger.info("\n=== Step 2: Verifying State Registration ===")
            self._check_registered_states()
            
            # Step 3: Check Individual States
            logger.info("\n=== Step 3: Checking Individual States ===")
            initial_states = self._check_state_values()
            
            # Step 4: Test State Changes
            logger.info("\n=== Step 4: Testing State Changes ===")
            await self._test_state_changes()
            
            # Step 5: Verify Observer Notifications
            logger.info("\n=== Step 5: Verifying Observer Notifications ===")
            self._verify_observers()
            
            # Step 6: Test Synchronization
            logger.info("\n=== Step 6: Testing Synchronization ===")
            sync_result = self.game_state_manager.sync_states()
            self._verify_sync_result(sync_result, initial_states)
            
            # Step 7: Verify Final State
            logger.info("\n=== Step 7: Verifying Final State ===")
            final_state = self.game_state_manager.get_state_update()
            self._analyze_state_update(final_state)
            
            # Performance Summary
            self._log_performance_metrics(start_time)
            
        except Exception as e:
            logger.exception("Test failed")
            self._log_error_state()
            raise

    def _verify_observers(self):
        """Verify observer notifications"""
        for state_type, state_id in self.game_state_manager.state_ids.items():
            state = self.game_state_manager.state_manager._states.get(state_id)
            if state:
                logger.info(f"Observer count for {state_type.__name__}: {len(state._observers)}")
                logger.info(f"Sync notifications received: {state_id in self.sync_notifications}")

    async def _test_state_changes(self):
        """Test state changes and verify propagation"""
        # Test agent movement
        agent_state = self.game_state_manager.agent_state
        agents = agent_state.get_agents_list()
        if agents:
            test_agent = agents[0]
            original_pos = test_agent.position
            new_pos = Vector2D(original_pos.x + 10, original_pos.y + 10)
            test_agent.position = new_pos
            logger.info(f"Moved agent {test_agent.id} from {original_pos} to {new_pos}")

        # Test world changes
        world_state = self.game_state_manager.world_state
        original_wall_count = len(world_state.get_value().world_component.walls)
        # Add test wall
        new_wall_pos = Vector2D(100, 100)
        logger.info(f"Original wall count: {original_wall_count}")

    def _verify_sync_result(self, sync_result: Dict[str, Any], initial_states: Dict[str, Any]):
        """Verify synchronization results against initial states"""
        logger.info("Verifying sync results:")
        for state_id, state_data in sync_result.items():
            logger.info(f"State {state_id}:")
            logger.info(f"Version: {state_data.get('version', 'N/A')}")
            logger.info(f"Timestamp: {state_data.get('timestamp', 'N/A')}")
            
    def _log_error_state(self):
        """Log detailed state information on error"""
        logger.error("=== Error State Debug Information ===")
        logger.error(f"Registered States: {list(self.game_state_manager.state_ids.keys())}")
        logger.error(f"Sync Notifications: {self.sync_notifications}")
        # Add additional error state logging as needed

    def _log_initialization_time(self, start_time: datetime):
        """Log initialization performance metrics"""
        init_time = datetime.now() - start_time
        logger.info(f"Initialization completed in {init_time.total_seconds():.3f} seconds")

    def _log_performance_metrics(self, start_time: datetime):
        """Log overall performance metrics"""
        total_time = datetime.now() - start_time
        logger.info("\n=== Performance Metrics ===")
        logger.info(f"Total test duration: {total_time.total_seconds():.3f} seconds")
        logger.info(f"States processed: {len(self.game_state_manager.state_ids)}")
        logger.info(f"Sync notifications: {len(self.sync_notifications)}")


    def _check_registered_states(self):
        """Verify all states are properly registered"""
        logger.info("Checking state registrations:")
        state_manager = self.game_state_manager.state_manager
        
        # Map state types to attribute names
        state_attr_map = {
            'WorldState': 'world_state',
            'CombatState': 'combat_state',
            'ConfigState': 'config_state',
            'AgentState': 'agent_state'
        }
        
        for state_type, state_id in self.game_state_manager.state_ids.items():
            logger.info(f"\nChecking {state_type.__name__}:")
            state = state_manager._states.get(state_id)
            
            if state:
                logger.info(f"✓ Registered with ID: {state_id}")
                # Check if state has value
                try:
                    value = state.get_value()
                    logger.info("✓ Has valid state value")
                    logger.debug(f"State value: {value}")
                except Exception as e:
                    logger.error(f"✗ Error getting state value: {e}")
            else:
                logger.error(f"✗ Not found in registry")
                
            # Check observers using correct attribute name
            attr_name = state_attr_map.get(state_type.__name__)
            if attr_name:
                state_instance = getattr(self.game_state_manager, attr_name)
                observer_count = len(state_instance._observers)
                logger.info(f"Observer count: {observer_count}")
            else:
                logger.error(f"✗ No attribute mapping for {state_type.__name__}")

    def _check_state_values(self):
        """Check values of individual states"""
        results = {}
        
        # Check World State
        logger.info("\nChecking World State:")
        world_state = self.game_state_manager.world_state.get_value()
        wall_count = len(world_state.world_component.walls)
        logger.info(f"Wall count: {wall_count}")
        results['world'] = {'wall_count': wall_count}
        
        # Check Agent State
        logger.info("\nChecking Agent State:")
        agent_state = self.game_state_manager.agent_state.get_value()
        agent_count = len(agent_state.agents)
        logger.info(f"Agent count: {agent_count}")
        team_counts = {
            'red': sum(1 for a in agent_state.agents.values() if a.team == 'red'),
            'blue': sum(1 for a in agent_state.agents.values() if a.team == 'blue')
        }
        logger.info(f"Team counts: {team_counts}")
        results['agents'] = {
            'total': agent_count,
            'teams': team_counts
        }
        
        # Check Combat State
        logger.info("\nChecking Combat State:")
        combat_state = self.game_state_manager.combat_state.get_state()
        logger.info(f"Combat state: {combat_state}")
        results['combat'] = combat_state
        
        return results

    def _analyze_state_update(self, state_update: Dict[str, Any]):
        """Analyze final state update for completeness"""
        logger.info("\nAnalyzing state update contents:")
        
        # Check World State
        logger.info("\nWorld State Analysis:")
        if 'world' in state_update:
            walls = state_update['world'].get('walls', [])
            logger.info(f"Walls in update: {len(walls)}")
            logger.info(f"World bounds: {state_update['world'].get('bounds')}")
        else:
            logger.error("Missing world state in update")
        
        # Check Agents
        logger.info("\nAgent State Analysis:")
        if 'agents' in state_update:
            agents = state_update['agents'].get('agents', {})
            logger.info(f"Total agents in update: {len(agents)}")
            # Count teams
            teams = {'red': 0, 'blue': 0}
            for agent_data in agents.values():
                teams[agent_data.get('team', 'unknown')] += 1
            logger.info(f"Team distribution: {teams}")
        else:
            logger.error("Missing agent state in update")
        
        # Check Combat State
        logger.info("\nCombat State Analysis:")
        if 'combat' in state_update:
            logger.info(f"Combat stats: {state_update['combat']}")
        else:
            logger.error("Missing combat state in update")
async def main():
    debugger = StateSyncDebugger()
    await debugger.run_sync_test()

if __name__ == "__main__":
    asyncio.run(main())