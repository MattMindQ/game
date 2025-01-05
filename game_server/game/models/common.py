from dataclasses import dataclass, field
from typing import Optional
import time

@dataclass
class DeadAgent:
    id: str
    team: str
    killer_team: Optional[str]
    lifetime: float
    death_time: float = field(default_factory=time.time)

    def to_dict(self):
        return {
            "id": self.id,
            "team": self.team,
            "killer_team": self.killer_team,
            "lifetime": self.lifetime,
        }