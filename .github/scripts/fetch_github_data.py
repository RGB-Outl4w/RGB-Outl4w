"""Fetch repo stats, latest releases and the contribution calendar into docs/data/github.json.

Runs in the Pages workflow, so visitors read one static file and never hit GitHub's API rate limit.
Needs GITHUB_TOKEN in the environment. Usage: python fetch_github_data.py <output path>
"""
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

USER = 'RGB-Outl4w'
TOKEN = os.environ['GITHUB_TOKEN']


def api(path, body=None):
    req = urllib.request.Request(
        'https://api.github.com' + path,
        data=json.dumps(body).encode() if body else None,
        headers={'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/vnd.github+json', 'User-Agent': USER},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


repos = {}
for r in api(f'/users/{USER}/repos?per_page=100&type=owner'):
    if r['fork'] or not r['has_pages']:
        continue
    info = {'stars': r['stargazers_count'], 'pushed': r['pushed_at']}
    try:
        rel = api(f"/repos/{USER}/{r['name']}/releases/latest")
        info['release'] = {'tag': rel['tag_name'], 'date': rel['published_at']}
    except urllib.error.HTTPError as e:
        if e.code != 404:  # 404 = no releases yet
            raise
    repos[r['name'].lower()] = info

QUERY = '''query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
  totalContributions weeks { contributionDays { date contributionCount } } } } } }'''
cal = api('/graphql', {'query': QUERY, 'variables': {'login': USER}})['data']['user']['contributionsCollection']['contributionCalendar']
days = [d for w in cal['weeks'] for d in w['contributionDays']]

out = {
    'updated': datetime.now(timezone.utc).isoformat(timespec='seconds'),
    'repos': repos,
    'contrib': {'total': cal['totalContributions'], 'start': days[0]['date'], 'counts': [d['contributionCount'] for d in days]},
}
os.makedirs(os.path.dirname(sys.argv[1]), exist_ok=True)
with open(sys.argv[1], 'w', encoding='utf-8') as f:
    json.dump(out, f, separators=(',', ':'))
print(f"{len(repos)} repos, {len(days)} days, {cal['totalContributions']} contributions")
