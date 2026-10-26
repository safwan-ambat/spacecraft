"""Build the Company field's suggestion files from Wikidata (CC0, public domain).

Sources, both queried through the QLever Wikidata mirror (qlever.dev):
  1. Indian companies: company types, or business/enterprise, located or headquartered in India
     (schools, colleges, hotels, branches, places, non-profits and international bodies excluded).
  2. Companies worldwide that have an English Wikipedia article (covers multinationals with Indian offices).

Output: dist/data/companies/<prefix>.json, one file per two-character prefix of the normalised name,
each a JSON array of names ranked by fame (how many Wikipedia languages cover the company), with a boost for Indian companies.
Re-run to refresh:  python3 scripts/fetch-company-names.py
"""
import json, re, shutil, unicodedata, urllib.parse, urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist' / 'data' / 'companies'
ENDPOINT = 'https://qlever.dev/api/wikidata'
INDIA_BOOST = 40  # an Indian company ranks as if covered by 40 more Wikipedia languages
PREFIXES = '''PREFIX wd: <http://www.wikidata.org/entity/> PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX schema: <http://schema.org/>
'''
NOT_COMPANIES = '''
 FILTER NOT EXISTS { ?c wdt:P31 ?x . VALUES ?x { wd:Q3914 wd:Q9842 wd:Q9826 wd:Q159334 wd:Q189004 wd:Q23002054 wd:Q27686 wd:Q1880737 wd:Q38723 wd:Q3918 } }
 FILTER NOT EXISTS { ?c wdt:P31/wdt:P279* wd:Q3914 }
 FILTER NOT EXISTS { ?c wdt:P31/wdt:P279* wd:Q27686 }
 FILTER NOT EXISTS { ?c wdt:P31/wdt:P279* wd:Q1880737 }
 FILTER NOT EXISTS { ?c wdt:P31/wdt:P279* ?place . VALUES ?place { wd:Q56061 wd:Q486972 wd:Q163740 wd:Q484652 wd:Q2659904 } }
'''
COMPANY_TYPES = '''{ ?c wdt:P31/wdt:P279* wd:Q783794 } UNION { VALUES ?t { wd:Q4830453 wd:Q6881511 wd:Q891723 wd:Q5225895 wd:Q1589009 wd:Q2085381 wd:Q15911314 wd:Q210167 wd:Q1137109 wd:Q18388277 wd:Q22687 } ?c wdt:P31 ?t }'''

INDIA = PREFIXES + '''SELECT DISTINCT ?c ?l ?sl WHERE {
 ''' + COMPANY_TYPES + '''
 { ?c wdt:P17 wd:Q668 } UNION { ?c wdt:P159 ?hq . ?hq wdt:P17 wd:Q668 }
 ?c rdfs:label ?l . FILTER(LANG(?l)="en") OPTIONAL { ?c wikibase:sitelinks ?sl }
''' + NOT_COMPANIES + '}'

WORLD = PREFIXES + '''SELECT DISTINCT ?c ?l ?sl WHERE {
 ''' + COMPANY_TYPES + '''
 ?a schema:about ?c ; schema:isPartOf <https://en.wikipedia.org/> .
 ?c rdfs:label ?l . FILTER(LANG(?l)="en") OPTIONAL { ?c wikibase:sitelinks ?sl }
''' + NOT_COMPANIES + '}'


def query(sparql):
    url = ENDPOINT + '?' + urllib.parse.urlencode({'query': sparql})
    req = urllib.request.Request(url, headers={'Accept': 'application/sparql-results+json',
                                               'User-Agent': 'SpaceCraftSite/1.0 (https://github.com/safwan-ambat/spacecraft)'})
    with urllib.request.urlopen(req, timeout=300) as r:
        rows = json.load(r)['results']['bindings']
    return [(b['c']['value'], b['l']['value'], int(b.get('sl', {}).get('value', 0))) for b in rows]


def key(name):
    """Lowercase ASCII letters/digits only, so 'Café Coffee Day' and 'cafe coffee day' match."""
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'^the\s+', '', s)
    return re.sub(r'[^a-z0-9]', '', s)


def usable(name):
    # Skip Wikidata item ids used as labels, very long labels and labels without any letters.
    return 2 <= len(name) <= 80 and re.search(r'[A-Za-z]', name) and not re.fullmatch(r'Q\d+', name)


def main():
    india, world = query(INDIA), query(WORLD)
    best = {}  # item -> (rank tuple, name)
    for rows, indian in ((india, 1), (world, 0)):
        for item, name, sitelinks in rows:
            name = name.strip()
            if not usable(name):
                continue
            rank = sitelinks + INDIA_BOOST * indian
            if item not in best or rank > best[item][0]:
                best[item] = (rank, name)

    by_name = {}  # one entry per distinct name, keeping its best rank
    for rank, name in best.values():
        k = name.casefold()
        if k not in by_name or rank > by_name[k][0]:
            by_name[k] = (rank, name)

    shards = defaultdict(list)
    for rank, name in by_name.values():
        k = key(name)
        if len(k) >= 2:
            shards[k[:2]].append((rank, name))

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    total = 0
    for prefix, items in shards.items():
        items.sort(key=lambda x: (-x[0], x[1].casefold()))
        (OUT / f'{prefix}.json').write_text(json.dumps([n for _, n in items], ensure_ascii=False, separators=(',', ':')))
        total += len(items)
    print(f'india rows {len(india)}, world rows {len(world)} -> {total} names in {len(shards)} files')


if __name__ == '__main__':
    main()
