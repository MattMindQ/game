// src/types/config.ts

export interface ConfigParameterMetadata {
    key: string;
    type: 'number' | 'boolean' | 'range';
    label: string;
    category: 'game' | 'combat' | 'movement' | 'world' | 'team';
    min?: number;
    max?: number;
    step?: number;
    description?: string;
  }
  
  export const CONFIG_SCHEMA: ConfigParameterMetadata[] = [
    // Game Settings
    {
      key: 'agentCount',
      type: 'number',
      label: 'Number of Agents',
      category: 'game'
    },
    {
      key: 'gameAreaSize',
      type: 'number',
      label: 'Game Area Size',
      category: 'game'
    },
    
    // Combat Settings
    {
      key: 'visualRange',
      type: 'number',
      label: 'Visual Range',
      category: 'combat'
    },
    {
      key: 'recognitionRange',
      type: 'number',
      label: 'Recognition Range',
      category: 'combat'
    },
    {
      key: 'combatRange',
      type: 'number',
      label: 'Combat Range',
      category: 'combat'
    },
    {
      key: 'baseDamage',
      type: 'number',
      label: 'Base Damage',
      category: 'combat'
    },
    
    // Movement Settings
    {
      key: 'baseSpeed',
      type: 'number',
      label: 'Base Speed',
      category: 'movement'
    },
    {
      key: 'turnSpeed',
      type: 'number',
      label: 'Turn Speed',
      category: 'movement'
    },
    
    // World Settings
    {
      key: 'enableWorldLogic',
      type: 'boolean',
      label: 'Enable World Logic',
      category: 'world',
      description: 'Enable Obstacles & Walls'
    },
    {
      key: 'obstacleCount',
      type: 'number',
      label: 'Obstacle Count',
      category: 'world'
    },
    {
      key: 'obstacleSize',
      type: 'number',
      label: 'Obstacle Size',
      category: 'world'
    },
    
    // Team Settings
    {
      key: 'teamBalance',
      type: 'range',
      label: 'Team Balance',
      category: 'team',
      min: -1,
      max: 1,
      step: 0.1
    },
    {
      key: 'respawnEnabled',
      type: 'boolean',
      label: 'Enable Respawn',
      category: 'team'
    },
    {
      key: 'respawnTime',
      type: 'number',
      label: 'Respawn Time (ms)',
      category: 'team'
    }
  ];