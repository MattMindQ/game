# test_state_registration.py
import asyncio
from uuid import UUID
from loguru import logger
from typing import Dict, Any, Tuple, List
from dataclasses import dataclass
from datetime import datetime
from game.state.manager import StateManager
from game.state.world_state import WorldState
from game.state.game_state_manager import GameStateManager
from game.state.base_state import BaseState

@dataclass
class TestResult:
    test_name: str
    status: str
    details: List[str]
    timestamp: datetime = datetime.now()

class StateRegistrationTester:
    def __init__(self):
        self.bounds = (0, 0, 800, 600)
        self.test_results: List[TestResult] = []
        
    def test_current_implementation(self) -> Tuple[StateManager, BaseState]:
        """Test current state registration behavior"""
        details = []
        try:
            # Create states
            state_manager = StateManager()
            world_state = WorldState(self.bounds)
            state_id = UUID('00000000-0000-0000-0000-000000000001')
            
            # Current registration behavior
            registered_state = state_manager.register_state(
                WorldState,
                world_state.get_value(),  # This returns WorldStateData
                state_id
            )
            
            # Get value directly from WorldStateData
            original_value = world_state.get_value()
            registered_value = registered_state.get_value()  # Use get_value() instead of _value
            
            # Collect test details
            details.extend([
                f"Original State Type: {type(world_state).__name__}",
                f"Registered State Type: {type(registered_state).__name__}",
                f"Initialize Method Present: {hasattr(registered_state, 'initialize')}",
                f"Get State Method Present: {hasattr(registered_state, 'get_state')}",
                f"Original Value Type: {type(original_value).__name__}",
                f"Registered Value Type: {type(registered_value).__name__}",
                f"Stored State Type: {type(state_manager._states[state_id]).__name__}",
                f"Type Registry Entry: {state_manager._type_registry.get(WorldState, {}).get(state_id) is not None}",
                f"Values Match: {str(original_value) == str(registered_value)}"  # Compare string representations
            ])
            
            # Check state functionality
            has_required_methods = all([
                hasattr(registered_state, 'get_value'),
                hasattr(registered_state, 'set_value'),
                hasattr(registered_state, 'get_state'),
            ])
            
            self.test_results.append(TestResult(
                test_name="Current Implementation Test",
                status="✓ PASS" if has_required_methods else "✗ FAIL",
                details=details
            ))
            
            return state_manager, registered_state
            
        except Exception as e:
            details.append(f"Error: {str(e)}")
            self.test_results.append(TestResult(
                test_name="Current Implementation Test",
                status="✗ ERROR",
                details=details
            ))
            raise

    def test_game_state_manager(self) -> None:
        """Test GameStateManager state registration"""
        details = []
        try:
            game_state_manager = GameStateManager(self.bounds)
            
            # Check each state type
            for state_type, state_id in game_state_manager.state_ids.items():
                state = game_state_manager.state_manager._states.get(state_id)
                value = state._value if state else None  # Access _value directly
                
                details.extend([
                    f"\n{state_type.__name__}:",
                    f"  - State Present: {state is not None}",
                    f"  - State Type: {type(state).__name__ if state else 'N/A'}",
                    f"  - Value Type: {type(value).__name__ if value else 'N/A'}",
                    f"  - Has Get State: {hasattr(state, 'get_state') if state else False}",
                    f"  - Has Initialize: {hasattr(state, 'initialize') if state else False}",
                    f"  - In Type Registry: {state_id in game_state_manager.state_manager._type_registry.get(state_type, {})}"
                ])
            
            all_states_valid = all(
                game_state_manager.state_manager._states.get(state_id) is not None
                for state_id in game_state_manager.state_ids.values()
            )
            
            self.test_results.append(TestResult(
                test_name="GameStateManager Test",
                status="✓ PASS" if all_states_valid else "✗ FAIL",
                details=details
            ))
            
        except Exception as e:
            details.append(f"Error: {str(e)}")
            self.test_results.append(TestResult(
                test_name="GameStateManager Test",
                status="✗ ERROR",
                details=details
            ))
    
    async def verify_state_sync(self, game_state_manager: GameStateManager) -> None:
        """Verify state synchronization"""
        details = []
        try:
            # Initialize game state
            await game_state_manager.initialize()
            
            # Get state update
            state_update = game_state_manager.get_state_update()
            
            # Check world state
            world_details = [
                f"World State:",
                f"  - Wall Count: {len(state_update['world']['walls'])}",
                f"  - Bounds Present: {bool(state_update['world'].get('bounds'))}",
            ]
            details.extend(world_details)
            
            # Check agent state
            agent_details = [
                f"\nAgent State:",
                f"  - Agent Count: {len(state_update['agents']['agents'])}",
                f"  - Red Team: {state_update['team_counts']['red']}",
                f"  - Blue Team: {state_update['team_counts']['blue']}"
            ]
            details.extend(agent_details)
            
            # Test sync mechanism
            sync_updates = game_state_manager.sync_states()
            sync_details = [
                f"\nSync State:",
                f"  - Updates Present: {bool(sync_updates)}",
                f"  - State Types: {list(sync_updates.keys()) if sync_updates else 'None'}"
            ]
            details.extend(sync_details)
            
            # Verify state consistency
            is_consistent = (
                len(state_update['world']['walls']) > 0 and
                len(state_update['agents']['agents']) > 0 and
                state_update['team_counts']['red'] == state_update['team_counts']['blue']
            )
            
            self.test_results.append(TestResult(
                test_name="State Synchronization Test",
                status="✓ PASS" if is_consistent else "✗ FAIL",
                details=details
            ))
            
        except Exception as e:
            details.append(f"Error: {str(e)}")
            self.test_results.append(TestResult(
                test_name="State Synchronization Test",
                status="✗ ERROR",
                details=details
            ))

    def print_report(self):
        """Print comprehensive test report"""
        logger.info("\n=== State Registration Test Report ===")
        logger.info(f"Test Run: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 50)
        
        for result in self.test_results:
            logger.info(f"\nTest: {result.test_name}")
            logger.info(f"Status: {result.status}")
            logger.info(f"Time: {result.timestamp.strftime('%H:%M:%S')}")
            logger.info("\nDetails:")
            for detail in result.details:
                logger.info(f"  {detail}")
            logger.info("-" * 50)
            
        # Summary
        total_tests = len(self.test_results)
        passed = sum(1 for r in self.test_results if "PASS" in r.status)
        failed = sum(1 for r in self.test_results if "FAIL" in r.status)
        errors = sum(1 for r in self.test_results if "ERROR" in r.status)
        
        logger.info("\n=== Summary ===")
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"Passed: {passed}")
        logger.info(f"Failed: {failed}")
        logger.info(f"Errors: {errors}")
        logger.info("=" * 50)

async def main():
    tester = StateRegistrationTester()
    
    # Run all tests
    state_manager, registered_state = tester.test_current_implementation()
    tester.test_game_state_manager()
    
    game_state_manager = GameStateManager(tester.bounds)
    await tester.verify_state_sync(game_state_manager)
    
    # Print comprehensive report
    tester.print_report()

if __name__ == "__main__":
    logger.remove()
    logger.add(lambda msg: print(msg), format="{message}")
    asyncio.run(main())