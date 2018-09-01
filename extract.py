from __future__ import annotations
import dataclasses
import datetime
import json
from multiprocessing import Pool, Queue
from pathlib import Path
import re
import time
from typing import Dict, List

import constants

CHANNEL = 'tfwiki'
PROCESSES = 4
QUEUE_END = None
MESSAGE_THRESHOLD = 1000


class EnhancedJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if dataclasses.is_dataclass(o):
            return dataclasses.asdict(o)
        elif isinstance(o, set):
            return list(o)
        elif isinstance(o, datetime.datetime):
            return datetime.datetime.isoformat(o)
        return super().default(o)


@dataclasses.dataclass
class QueueItem:
    date: datetime.date
    users: Dict[str, DayUser]
    hours: List[Hour]


@dataclasses.dataclass
class DayUser:
    joined: datetime.datetime
    last_seen: datetime.datetime
    messages: int = 0
    sum_text_size: int = 0


@dataclasses.dataclass
class User(DayUser):
    days_active: int = 0


@dataclasses.dataclass
class Hour:
    messages: int = 0


def normalize_nick(nick: str) -> str:
    nick = (nick[:-3] if nick[-3:].lower() == '[m]' else nick).rstrip('_')
    nick = constants.ALIASES.get(nick, nick)
    return nick.lower()


def set_queue(queue: Queue):
    process_file.queue = queue


def process_file(path: Path):
    users = {}
    hours = [Hour() for _ in range(24)]

    text = path.read_text('utf-8')
    for line in re.split("\\n(?=\[)", text.strip()):
        if not line.strip():
            continue

        timestamp = datetime.datetime.strptime(line[1:20], "%Y-%m-%d %H:%M:%S")
        line = line[22:]
        if line[0] == '*':
            pass
        elif line[0] == '<':
            match = re.match("(?P<nick><.+?>) (?P<message>.*)", line).groupdict()
            nick, message = match["nick"][1:-1], match["message"]
            if nick in constants.SKIP:
                continue
            nick = normalize_nick(nick)
            if nick not in users:
                users[nick] = DayUser(joined=timestamp, last_seen=timestamp)

            users[nick].messages += 1
            users[nick].sum_text_size += len(message)
            users[nick].last_seen = timestamp

            hours[timestamp.hour].messages += 1

    process_file.queue.put(QueueItem(
        date=datetime.date.fromisoformat(path.stem),
        users=users,
        hours=hours,
    ))


def compress(queue: Queue) -> dict:
    users = {}
    hours = [Hour() for _ in range(24)]
    months = {}
    years = {}

    while True:
        item = queue.get(block=True)
        if item is QUEUE_END:
            return {
                'users': users,
                'hours': hours,
                'months': months,
                'years': years,
            }

        for nick, day_user in item.users.items():
            if nick not in users:
                users[nick] = User(day_user.joined, day_user.last_seen)
            user = users[nick]

            if day_user.joined < user.joined:
                user.joined = day_user.joined
            if day_user.last_seen > user.last_seen:
                user.last_seen = day_user.last_seen
            user.days_active += 1
            user.messages += day_user.messages
            user.sum_text_size += day_user.sum_text_size

        if item.date.year not in months:
            months[item.date.year] = []

        for i, hour in enumerate(item.hours):
            hours[i].messages += hour.messages


def filter_users(users: dict):
    to_delete = {
        nick for nick, user in users.items()
        if user.messages < MESSAGE_THRESHOLD
    }

    for nick in to_delete:
        del users[nick]


def main(source: Path, target: Path):
    start = time.time()
    queue = Queue()
    with Pool(processes=PROCESSES, initializer=set_queue, initargs=(queue,)) as pool:
        pool.map_async(
            process_file,
            source.glob('**/*.*'),
            callback=lambda _: queue.put(QUEUE_END),
            error_callback=lambda _: print('error', _)
        )
        pool.close()
        result = compress(queue)
        filter_users(result['users'])
        pool.join()
    print(f'{time.time()-start}')

    target.write_text(json.dumps(result, cls=EnhancedJSONEncoder))


if __name__ == '__main__':
    main(Path(f'./logs/{CHANNEL}'), Path(f'{CHANNEL}.json'))
