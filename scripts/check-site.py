from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,collections
D=Path(__file__).resolve().parents[1]/'dist'
class Page(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.assets=[];self.ids=[];self.title=False;self.title_text='';self.h1=0
 def handle_starttag(self,t,a):
  d=dict(a)
  if 'id' in d:self.ids.append(d['id'])
  if t=='a' and d.get('href'):self.links.append(d['href'])
  if t in ['img','script'] and d.get('src'):self.assets.append(d['src'])
  if t=='link' and d.get('rel')=='stylesheet':self.assets.append(d['href'])
  if t=='title':self.title=True
  if t=='h1':self.h1+=1
 def handle_endtag(self,t):
  if t=='title':self.title=False
 def handle_data(self,d):
  if self.title:self.title_text+=d
pages={p:Page() for p in D.rglob('*.html')};errors=[]
for p,parser in pages.items():parser.feed(p.read_text())
for p,parser in pages.items():
 if parser.h1!=1:errors.append(f'{p.relative_to(D)}: {parser.h1} h1 elements')
 if len(parser.ids)!=len(set(parser.ids)):errors.append(f'{p}: duplicate id')
 if 'Space Craft' not in parser.title_text:errors.append(f'{p}: title')
 if '18, Buddha Vihara Rd, Cox Town, Bengaluru, Karnataka 560005' not in p.read_text():errors.append(f'{p}: missing address')
 for href in parser.links+parser.assets:
  u=urlsplit(href)
  if u.scheme or u.netloc:continue
  target=D/unquote(u.path.lstrip('/')) if u.path.startswith('/') else p.parent/unquote(u.path)
  if not u.path:target=p
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append(f'{p.relative_to(D)}: missing {href}');continue
  if u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:errors.append(f'{p.relative_to(D)}: missing anchor {href}')
assert not errors,'\n'.join(errors[:80])
coverage=json.loads((D.parent/'scripts/page-coverage.json').read_text())
print(f'PASS: {len(pages)} HTML files, all internal links, anchors and assets; one H1 per page; address across all pages.')
print(f'PASS: all {coverage["reference_routes"]} OfficeBanao sitemap subpage routes covered.')
