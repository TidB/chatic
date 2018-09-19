from __future__ import annotations
import datetime
import dataclasses
from typing import Dict, List, Tuple


@dataclasses.dataclass
class QueueItem:
    date: datetime.date
    users: Dict[str, User]
    hours: List[Hour]


@dataclasses.dataclass
class User:
    joined: datetime.datetime
    last_seen: datetime.datetime
    messages: int = 0
    sum_text_size: int = 0


@dataclasses.dataclass
class Month:
    messages: int = 0
    sum_text_size: int = 0
    unique_users: set = dataclasses.field(default_factory=set)


@dataclasses.dataclass
class CompressedResult:
    timespan: Tuple[datetime.datetime, datetime.datetime]
    users: Dict[str, CompressedUser] = dataclasses.field(default_factory=dict)
    hours: List[Hour] = dataclasses.field(default_factory=list)
    months: Dict[int, Dict[int, Month]] = dataclasses.field(default_factory=dict)


@dataclasses.dataclass
class CompressedUser(User):
    days_active: int = 0

    @property
    def avg_message_size(self):
        return self.sum_text_size / self.messages


@dataclasses.dataclass
class Hour:
    messages: int = 0


@dataclasses.dataclass
class CompressedMonth:
    messages: int = 0
    sum_text_size: int = 0
    unique_users: int = 0


@dataclasses.dataclass
class Year:
    messages: int = 0
    sum_text_size: int = 0
    unique_users: int = 0


@dataclasses.dataclass
class Result:
    timespan: Tuple[datetime.datetime, datetime.datetime]
    messages: int = 0
    sum_text_size: int = 0
    unique_users: int = 0
    users: Dict[str, CompressedUser] = dataclasses.field(default_factory=dict)
    hours: List[Hour] = dataclasses.field(default_factory=list)
    months: Dict[int, Dict[int, CompressedMonth]] = dataclasses.field(default_factory=dict)
    years: Dict[int, Year] = dataclasses.field(default_factory=dict)