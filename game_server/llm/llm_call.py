# game_server/llm/llm_service.py
import anthropic
import os
import logging
import asyncio
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from .prompts import REFORMULATION_PROMPT, BEHAVIOR_PROMPT
from .context_handler import LLMContextHandler

load_dotenv()
logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        self.model = "claude-3-5-sonnet-20241022"
        self.max_tokens = 6980
        self.temperature = 0
        self.context_handler = LLMContextHandler()

    async def process_copilot_query(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process a query from the copilot with full context awareness"""
        try:
            # Ensure context is a dictionary
            if context is None:
                context = {}
            elif not isinstance(context, dict):
                logger.warning(f"Invalid context type: {type(context)}")
                context = {}

            # Generate reformulation
            reformulation = await self.generate_reformulation(query, context)
            
            response_data = {
                "reformulation": reformulation,
                "code": None
            }

            # Check if code generation is needed
            if self.context_handler.should_generate_code(context, query):
                code = await self.generate_code(query, reformulation, context)
                response_data["code"] = code

            return response_data

        except Exception as e:
            logger.error(f"Error processing copilot query: {str(e)}")
            raise

    async def generate_reformulation(self, description: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Generate reformulation with optional context awareness"""
        try:
            # Format context if provided
            context_str = ""
            if context:
                try:
                    context_str = self.context_handler.format_game_context(context)
                except Exception as e:
                    logger.error(f"Error formatting context: {str(e)}")
                    context_str = str(context)

            # Build prompt with context
            prompt = REFORMULATION_PROMPT.replace("{{description}}", description)
            if context_str:
                prompt = f"Context:\n{context_str}\n\n{prompt}"

            message = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ]
            )
            return message.content[0].text
            
        except Exception as e:
            logger.error(f"Error generating reformulation: {str(e)}")
            raise

    async def generate_code(self, description: str, reformulation: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Generate code with context-aware behavior requirements"""
        try:
            # Get code-specific context if available
            code_context = ""
            if context:
                code_context = self.context_handler.format_code_context(context)

            # Build prompt with context
            prompt = BEHAVIOR_PROMPT.replace("{{description}}", description).replace("{{reformulation}}", reformulation)
            if code_context:
                prompt = f"Code Requirements:\n{code_context}\n\n{prompt}"

            message = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ]
            )
            return message.content[0].text
            
        except Exception as e:
            logger.error(f"Error generating code: {str(e)}")
            raise


async def test_service():
    logging.basicConfig(level=logging.INFO)
    
    try:
        service = LLMService()
        
        # Test context-aware query
        test_context = {
            "elementId": "codeEditor",
            "elementName": "Behavior Editor",
            "description": "Editor for modifying agent behaviors"
        }
        
        test_description = "Create a behavior where agents protect their teammates"
        
        # Test with context
        logger.info("Testing with context...")
        result = await service.process_copilot_query(test_description, test_context)
        
        print("\nReformulation:")
        print(result["reformulation"])
        
        if result["code"]:
            print("\nGenerated Code:")
            print(result["code"])
        
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(test_service())