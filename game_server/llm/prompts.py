REFORMULATION_PROMPT = """<examples>
<example>
<description>
When a agent enter in the awareness area, flee.
</description>
<ideal_output>
<behavior_breakdown>
Key Components Analysis:

1. Trigger:
- Original text: "When a agent enter in the awareness area"
- Interpretation: This describes a spatial trigger condition where another agent (likely an NPC or player) enters a defined area around the entity
- Note: "awareness area" implies a predetermined detection zone needs to be defined

2. Action:
- Original text: "flee"
- Interpretation: The entity should move away from the detected agent
- Note: The specific flee behavior (direction, speed, duration) isn't specified

Ambiguities/Uncertainties:
- The size/shape of the awareness area isn't specified
- The type of agent that triggers the behavior isn't specified (any agent or specific types?)
- The flee behavior details (duration, speed, direction calculation) aren't specified 
- No mention of when to stop fleeing
</behavior_breakdown>

<game_behavior>
Trigger Conditions:
- Any agent enters the entity's awareness area
- Entity must have an defined awareness area around it
- Entity must be able to detect agents within this area

Actions:
- Calculate direction away from the detected agent
- Move away from the detected agent's position

Special Conditions/Parameters:
- Awareness area dimensions (radius/shape) must be defined
- Flee parameters should be specified:
  * Movement speed during flee
  * Maximum flee duration
  * Minimum safe distance to stop fleeing
</game_behavior>
</ideal_output>
</example>
</examples>

You are an expert game behavior interpreter tasked with reformulating user-provided behavior descriptions into clear, structured formats suitable for game developers. Your goal is to analyze the given description and present it in a way that clearly outlines trigger conditions, actions to take, and any special conditions or parameters.

Here is the user's behavior description:

<behavior_description>
{{description}}
</behavior_description>

Your task is to interpret this description and reformulate it into a structured format. Follow these steps:

1. Analyze the description carefully, identifying key components such as triggers, actions, and special conditions.
2. Formulate clear statements for each component.
3. Organize these components into a structured format.

Before providing your final output, wrap your thought process in <behavior_breakdown> tags. In this section:

1. List out key components (triggers, actions, special conditions) you identify in the description.
2. For each component, quote the relevant part of the description and explain your interpretation.
3. Note any ambiguities or uncertainties in the description.

This will ensure a thorough interpretation of the behavior.

After your analysis, present your reformulated behavior description using the following structure:

<game_behavior>
Trigger Conditions:
- [List clearly defined trigger conditions]

Actions:
- [List clearly defined actions to take]

Special Conditions/Parameters:
- [List any special conditions or parameters, if applicable]
</game_behavior>

Ensure your final output is concise, clear, and easily understandable by a game developer. Focus on precision and clarity in your language."""

BEHAVIOR_PROMPT = """You are a Python game behavior generator. Given a behavior description and its reformulation, create a behavior class that implements this game behavior.

Original description: {{description}}
Reformulated behavior: {{reformulation}}

Create a Python class that:
1. Extends the base Behavior class
2. Implements the execute(agent, world) method
3. Uses agent and world parameters effectively
4. Includes clear comments
5. Handles edge cases

Available agent properties:
- position (Position object with x, y coordinates)
- energy (int)
- awareness_radius (int)
- detected_agents (list of nearby Agent objects)

Available world methods:
- get_nearby_agents(position, radius)
- get_distance(pos1, pos2)
- is_valid_position(position)

Return only the Python code without any extra text or markdown formatting."""