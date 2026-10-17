import re,html,json,os,sys
SRC=sys.argv[1]; OUT=sys.argv[2]
s=open(SRC,encoding='utf-8').read()
BASE='https://meldroide99.github.io/vida-sin-friccion/'
def txt(x): return html.unescape(re.sub(r'<br\s*/?>','\n',re.sub(r'<(?!br)[^>]+>','',x))).strip()
caps=[]
secs=[('intro','0','Introducción','Demasiadas decisiones','Empieza aquí: tu perfil base.')]
for n in range(1,8):
    i=s.index(f'id="cap-{n}"'); a=s.rindex('<article',0,i); A=s[a:s.index('</article>',i)]
    t=txt(re.search(r'<h2>(.*?)</h2>',A).group(1)); pr=txt(re.search(r'class="cap-principio">(.*?)</p>',A).group(1))
    parte=txt(re.search(r'class="cap-parte">(.*?)</p>',A).group(1))
    secs.append((f'cap-{n}',str(n),parte,t,pr))
for sid,num,parte,t,pr in secs:
    i=s.index(f'id="{sid}"'); a=s.rindex('<article',0,i); A=s[a:s.index('</article>',i)]
    ps=[]
    for m in re.finditer(r'<div class="prompt" id="p-(\d+)-(\d+)"><div class="prompt-cab"><span><span class="id">([^<]*)</span>([^<]*)((?:<span class="nivel"[^>]*>[^<]*</span>\s*)*)</span>.*?<pre[^>]*>(.*?)</pre>',A,re.S):
        lv=[x.split()[1] if len(x.split())>1 else x for x in re.findall(r'>([^<]+)</span>',m.group(5))]
        ps.append(dict(code=m.group(3),k=f'{m.group(1)}-{m.group(2)}',name=m.group(4).strip(),lv=lv,text=txt(m.group(6))))
    ps.sort(key=lambda p:int(p['k'].split('-')[1]))
    caps.append(dict(num=num,parte=parte,title=t,principle=pr,prompts=ps))
ICON={'Rápido':'⚡','Razonamiento':'🧠','Búsqueda':'🌐'}
HEAD='''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title><meta name="description" content="{desc}"><link rel="icon" href="{root}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Manrope:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"><meta name="color-scheme" content="light"><meta name="theme-color" content="#FCFBF9">
<link rel="stylesheet" href="{root}style.css"></head><body>'''
def lv_html(p): return ''.join(f'<span class="nivel" title="{l}">{ICON.get(l,"")} {l}</span>' for l in p['lv'])
def card(p):
    return f'''<article class="prompt" id="p-{p['k']}"><header><span class="code">{p['code']}</span><h3>{html.escape(p['name'])}</h3><div class="niveles">{lv_html(p)}</div></header>
<pre class="texto">{html.escape(p['text'])}</pre>
<div class="barra-acc"><button type="button" class="btn-p personalizar" aria-expanded="false">Personalizar</button><button type="button" class="btn-p copiar" aria-label="Copiar {p['code']}">Copiar</button><span class="estado" aria-live="polite"></span></div>
<div class="panel" hidden></div></article>'''
def nav(root,cur):
    items=''.join(f'<a href="{root}c{c["num"]}/"{" aria-current=\"page\"" if c["num"]==cur else ""}>{"Intro" if c["num"]=="0" else c["num"]}</a>' for c in caps)
    items+=f'<a href="{root}plantillas/"{" aria-current=\"page\"" if cur=="pl" else ""}>Plantillas</a>'
    return f'<header class="top"><div class="wrap"><a class="marca" href="{root}">Vida <i>sin</i> fricción</a><nav aria-label="Capítulos">{items}</nav></div></header>'
FOOT='<footer class="pie"><div class="wrap"><p>Prompts del libro <em>Vida sin fricción</em>, de M.SDT. Cópialos y úsalos para ti.</p><p>Este sitio no está afiliado a OpenAI, Anthropic, Google ni Notion Labs. No recoge datos ni usa cookies.</p></div></footer><script src="{root}app.js"></script></body></html>'
GUIA_HTML="""<section class="guia" aria-label="Cómo funciona"><h2>Cómo funciona</h2><ol>
<li><span>1</span><div><b>Pulsa Personalizar</b> en el prompt que quieras.</div></li>
<li><span>2</span><div><b>Rellena o elige</b> tus datos. El texto se actualiza mientras escribes.</div></li>
<li><span>3</span><div><b>Copia y pega</b> en ChatGPT, Claude o Gemini. Ya está listo.</div></li></ol>
<p>Lo que escribes se guarda solo en este dispositivo y se reutiliza en otros prompts: tu ciudad o tu nómina se escriben una vez. ¿Prefieres hacerlo a mano? Pulsa <b>Copiar</b> directamente.</p></section>"""
os.makedirs(OUT,exist_ok=True)
for c in caps:
    d=os.path.join(OUT,f'c{c["num"]}'); os.makedirs(d,exist_ok=True)
    lab='Introducción' if c['num']=='0' else f'Capítulo {c["num"]}'
    i=caps.index(c); prev=caps[i-1] if i>0 else None; nxt=caps[i+1] if i<len(caps)-1 else None
    pn=''.join([f'<a class="prev" href="../c{prev["num"]}/"><small>Anterior</small>{html.escape(prev["title"])}</a>' if prev else '<span></span>', f'<a class="next" href="../c{nxt["num"]}/"><small>Siguiente</small>{html.escape(nxt["title"])}</a>' if nxt else ''])
    body=f'''{nav("../",c["num"])}<section class="cab-px" data-escena><div class="cab-px-img" data-zoom aria-hidden="true"><img src="../img/c{c["num"]}.webp" alt="" width="1600" height="1067" fetchpriority="high"></div><div class="wrap cab-px-texto" data-fade><p class="etq">{lab}</p><h1>{html.escape(c["title"])}</h1><p class="principio">{html.escape(c["principle"])}</p></div></section><main class="wrap"><section class="guia" aria-label="Cómo funciona"><h2>Cómo funciona</h2><ol>
<li><span>1</span><div><b>Pulsa Personalizar</b> en el prompt que quieras.</div></li>
<li><span>2</span><div><b>Rellena o elige</b> tus datos. El texto se actualiza mientras escribes.</div></li>
<li><span>3</span><div><b>Copia y pega</b> en ChatGPT, Claude o Gemini. Ya está listo.</div></li></ol>
<p>Lo que escribes se guarda solo en este dispositivo y se reutiliza en otros prompts: tu ciudad o tu nómina se escriben una vez. ¿Prefieres hacerlo a mano? Pulsa <b>Copiar</b> directamente.</p></section>
<div class="lista">{"".join(card(p) for p in c["prompts"])}</div><nav class="pasar">{pn}</nav></main>'''
    open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(HEAD.format(title=f'{lab}: {c["title"]} · Vida sin fricción',desc=f'Prompts listos para copiar del {lab.lower()} de Vida sin fricción.',root='../')+body+FOOT.format(root='../'))
cards=''.join(f'''<a class="capcard" href="c{c["num"]}/"><span class="num">{c["num"]}</span><span class="t"><b>{html.escape(c["title"])}</b><small>{len(c["prompts"])} prompt{"s" if len(c["prompts"])!=1 else ""} · {html.escape(c["principle"])}</small></span></a>''' for c in caps)
data=[dict(code=p['code'],name=p['name'],url=f'c{c["num"]}/#p-{p["k"]}',cap=c['title'],q=(p['code']+' '+p['name']+' '+p['text']).lower()) for c in caps for p in c['prompts']]

pasos=''.join(f"""<li class="paso" data-k="{c['num']}"><figure class="paso-img" aria-hidden="true"><img src="img/c{c['num']}.webp" alt="" width="1600" height="1067" loading="lazy"></figure><p class="paso-n">{'Introducción' if c['num']=='0' else 'Capítulo '+c['num']}</p><h2>{html.escape(c['title'])}</h2><p class="paso-p">{html.escape(c['principle'])}</p><a class="paso-a" href="c{c['num']}/">Ver {len(c['prompts'])} prompt{'s' if len(c['prompts'])!=1 else ''}</a></li>""" for c in caps)
media=''.join(f"""<figure data-k="{c['num']}"{' class="on"' if c['num']=='0' else ''}><img src="img/c{c['num']}.webp" alt="" width="1600" height="1067" loading="lazy"></figure>""" for c in caps)
GUIA2=GUIA_HTML
idx=f"""{nav("","")}<section class="historia" id="inicio"><div class="historia-fija"><canvas id="lienzo" aria-hidden="true"></canvas>
<div class="h-textos"><div class="h-t h-portada" data-a="0" data-b=".17"><p class="firma">M.SDT</p><h1>Vida <i>sin</i> fricción</h1><p class="sub">Los {len(data)} prompts del libro, listos para hacer tuyos y copiar.</p></div>
<p class="h-t h-frase" data-a=".19" data-b=".42">Tu cabeza no es una agenda.</p>
<p class="h-t h-frase" data-a=".44" data-b=".62">Decide una vez.</p>
<p class="h-t h-frase" data-a=".64" data-b=".82">Repite siempre.</p>
<div class="h-t h-final" data-a=".85" data-b="1.2"><p class="h-frase">Y sigue tu camino.</p><a class="paso-a" href="#capitulos">Ver los capítulos</a></div></div>
<div class="h-progreso" aria-hidden="true"><span></span></div><p class="desliza">Desliza</p></div></section>
<div id="capitulos"></div><section class="recorrido" aria-label="Capítulos"><div class="recorrido-media" aria-hidden="true">{media}</div><ol class="recorrido-lista">{pasos}<li class="paso paso-pl" data-k="pl"><p class="paso-n">Para usar cada semana</p><h2>Plantillas</h2><p class="paso-p">Perfil, menú, nómina, casa, vencimientos, Notion y plan de 30 días. Se rellenan, calculan y copian.</p><a class="paso-a" href="plantillas/">Abrir plantillas</a></li></ol></section>
<main class="wrap"><section class="zona-buscar" id="buscar"><h2 class="titulo-sec">Encuentra un prompt</h2><label class="buscar"><span>Buscar un prompt</span><input type="search" id="q" placeholder="Por código o tema: P 4.4, menú, seguros…" autocomplete="off"></label><ul id="res" class="res" hidden></ul></section>
{GUIA2}<section class="leyenda" aria-label="Niveles"><span><span class="nivel">⚡ Rápido</span> sirve cualquier IA</span><span><span class="nivel">🧠 Razonamiento</span> mejor con un modelo avanzado</span><span><span class="nivel">🌐 Búsqueda</span> necesita buscar en internet</span></section></main><script>window.PROMPTS={json.dumps(data,ensure_ascii=False)};</script><script src="historia.js"></script>"""
open(os.path.join(OUT,'index.html'),'w',encoding='utf-8').write(HEAD.format(title='Vida sin fricción · Prompts del libro',desc='Todos los prompts del libro Vida sin fricción, listos para copiar.',root='')+idx+FOOT.format(root=''))
open(os.path.join(OUT,'404.html'),'w',encoding='utf-8').write(HEAD.format(title='Página no encontrada · Vida sin fricción',desc='',root='/vida-sin-friccion/')+nav('/vida-sin-friccion/','')+'<main class="wrap"><section class="hero"><h1>Esta página no existe</h1><p class="sub"><a href="/vida-sin-friccion/">Vuelve al inicio</a> para ver todos los prompts.</p></section></main>'+FOOT.format(root='/vida-sin-friccion/'))
open(os.path.join(OUT,'.nojekyll'),'w').write('')
print(sum(len(c['prompts']) for c in caps),'prompts',[len(c['prompts']) for c in caps])

d=os.path.join(OUT,'plantillas'); os.makedirs(d,exist_ok=True)
body=open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'plantillas_body.html'),encoding='utf-8').read()
open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(HEAD.format(title='Plantillas · Vida sin fricción',desc='Plantillas interactivas del libro Vida sin fricción: perfil, menú, nómina, compra de casa, vencimientos, Notion y plan de 30 días.',root='../')+nav('../','pl')+body+FOOT.format(root='../').replace('</body>','<script src="../plantillas.js"></script></body>'))
