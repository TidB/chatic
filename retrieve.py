import datetime
from pathlib import Path
import time

import requests

CHANNEL = 'tfwiki'
DAY = datetime.timedelta(days=1)
FIRST = datetime.date(2017, 4, 19)  # Earliest logs since Wind's DB got killed
DELAY = 5  # Wind recommended one request every five seconds


def get_last_in_dir(path: Path) -> Path:
    return sorted(path.iterdir(), key=lambda p: p.stem)[-1]


def get_last_date(target: Path) -> datetime.date:
    last_log = \
        get_last_in_dir(  # Get last log
            get_last_in_dir(  # Get last month
                get_last_in_dir(  # Get last year
                    target
                )
            )
        )

    return datetime.date.fromisoformat(last_log.stem)


# the until parameter is exclusive
def retrieve(source: str, target: Path, after: datetime.date, until: datetime.date):
    date = after
    # Iter over years
    while True:
        year = date.year
        # Iter over months
        while True:
            month = date.month
            month_dir = target / str(year) / str(month).zfill(2)
            if not month_dir.exists():
                month_dir.mkdir(parents=True)

            # Iter over days
            while True:
                file = (month_dir / date.isoformat()).with_suffix('.txt')
                url = source + f'/{date.isoformat()}.txt'
                try:
                    print("Retrieving", url)
                    text = requests.get(url).text
                    if text.strip():
                        file.write_text(text, 'utf-8')
                except Exception as e:
                    print(date.isoformat(), e)

                date += DAY
                if date == until:
                    return

                time.sleep(DELAY)

                if date.month != month:
                    break
            if date.year != year:
                break


def main(source: str, target: Path):
    if not target.exists():
        target.mkdir(parents=True)
        start_date = FIRST
    else:
        start_date = get_last_date(target) + DAY

    retrieve(source, target, start_date, datetime.date.today())


if __name__ == '__main__':
    main(f'https://irc.biringa.com/channel/{CHANNEL}', Path(f'./logs/{CHANNEL}'))
