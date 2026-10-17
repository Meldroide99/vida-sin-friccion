(function(){
var S={};try{S=JSON.parse(localStorage.getItem('vsf-plantillas')||'{}')}catch(e){}
function save(){try{localStorage.setItem('vsf-plantillas',JSON.stringify(S))}catch(e){}}
function $(id){return document.getElementById(id)}
function eur(n){return isFinite(n)?n.toLocaleString('es-ES',{maximumFractionDigits:0})+' €':'—'}
function num(k){var v=parseFloat(String(S[k]||'').replace(',','.'));return isNaN(v)?NaN:v}
function val(el){return el.value}
// Menú
var dias=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
$('menu-body').innerHTML=dias.map(function(d,i){return '<tr><th scope="row">'+d+'</th><td><input data-k="mn-c'+i+'" aria-label="Comida del '+d+'"></td><td><input data-k="mn-n'+i+'" aria-label="Cena del '+d+'"></td></tr>'}).join('');
// Fases
var fases=[['¿Me lo puedo permitir?','Precio máximo, entrada, impuestos y gastos.'],['Buscar','Zona, tipo de vivienda y lista para cada visita.'],['Revisar el piso','Nota simple del Registro, cargas, deudas con la comunidad, IBI y certificado energético.'],['Negociar y reservar','Precio y contrato de arras, revisado antes de firmar.'],['La hipoteca','Comparar ofertas de varios bancos, tipo y plazo.'],['Firmar y entrar','Notario, cambios de titular de suministros y trámites posteriores.']];
$('cs-fases').innerHTML=fases.map(function(f,i){return '<li><label><input type="checkbox" data-k="cs-f'+i+'"><span><b>'+(i+1)+' · '+f[0]+'.</b> '+f[1]+'</span></label></li>'}).join('');
var plan=[['Días 1–7','Captura de notas y la página Mi segundo cerebro (capítulos 1 y 7).'],['Días 8–14','Menú semanal y ahorro automático (capítulos 3 y 4).'],['Días 15–21','Carpetas del hogar y tareas repetitivas del trabajo (capítulos 5 y 6).'],['Días 22–28','Tu tutor y la conexión de la IA con Notion (capítulos 2 y 7).'],['Días 29–30','Revisión completa: qué mantener y qué quitar.']];
$('pl-plan').innerHTML=plan.map(function(p,i){return '<li><label><input type="checkbox" data-k="pl-p'+i+'"><span><b>'+p[0]+'.</b> '+p[1]+'</span></label></li>'}).join('');
var rev=['Tareas abiertas de Notas y Trabajo, ordenadas por fecha.','Vencimientos del hogar de las próximas semanas.','Menú y lista de la compra de la semana que viene.','Cómo voy con mi plan de ahorro.','Repasos pendientes de Estudio.','Elegir tres prioridades y guardarlas en Notion.'];
$('pl-rev').innerHTML=rev.map(function(r,i){return '<li><label><input type="checkbox" data-k="rv-'+i+'"><span>'+r+'</span></label></li>'}).join('');
// Hogar rows
var carpetas=['Vivienda','Vehículo','Seguros','Impuestos','Salud y personal'];
if(!Array.isArray(S.hg))S.hg=[{q:'Seguro de hogar',c:'Seguros',f:'',i:''},{q:'ITV del coche',c:'Vehículo',f:'',i:''},{q:'IBI',c:'Impuestos',f:'',i:''}];
function aviso(f){if(!f)return '';var d=new Date(f+'T12:00:00');d.setDate(d.getDate()-30);return d.toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}
function drawHg(){$('hg-body').innerHTML=S.hg.map(function(r,i){return '<tr><td><input data-h="q" data-i="'+i+'" value="'+esc(r.q)+'" aria-label="Qué vence"></td><td><select data-h="c" data-i="'+i+'" aria-label="Carpeta">'+carpetas.map(function(c){return '<option'+(c===r.c?' selected':'')+'>'+c+'</option>'}).join('')+'</select></td><td><input type="date" data-h="f" data-i="'+i+'" value="'+esc(r.f)+'" aria-label="Fecha"></td><td><input type="number" inputmode="decimal" data-h="i" data-i="'+i+'" value="'+esc(r.i)+'" aria-label="Importe"></td><td class="av">'+aviso(r.f)+'</td><td><button class="x" data-del="'+i+'" aria-label="Quitar fila">×</button></td></tr>'}).join('')}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
drawHg();
$('hg-body').addEventListener('input',function(e){var t=e.target;if(!t.dataset.h)return;S.hg[+t.dataset.i][t.dataset.h]=t.value;save();if(t.dataset.h==='f')t.closest('tr').querySelector('.av').textContent=aviso(t.value)});
$('hg-body').addEventListener('click',function(e){var b=e.target.closest('[data-del]');if(!b)return;S.hg.splice(+b.dataset.del,1);save();drawHg()});
$('hg-add').addEventListener('click',function(){S.hg.push({q:'',c:'Vivienda',f:'',i:''});save();drawHg();var r=$('hg-body').lastElementChild;r&&r.querySelector('input').focus()});
$('hg-ics').addEventListener('click',function(){
 var rows=S.hg.filter(function(r){return r.q&&r.f});if(!rows.length){alertMsg('hg-ics','Añade al menos una fecha');return}
 var L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Vida sin friccion//Plantillas//ES','CALSCALE:GREGORIAN'];
 rows.forEach(function(r,i){var d=r.f.replace(/-/g,''),n=new Date(r.f+'T12:00:00');n.setDate(n.getDate()+1);var e=n.toISOString().slice(0,10).replace(/-/g,'');
  L.push('BEGIN:VEVENT','UID:vsf-'+i+'-'+d+'@vidasinfriccion','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z','DTSTART;VALUE=DATE:'+d,'DTEND;VALUE=DATE:'+e,'SUMMARY:Vence: '+r.q.replace(/[,;\\]/g,' '),'DESCRIPTION:Carpeta '+r.c+(r.i?' · '+r.i+' EUR':''),'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Vence en 30 días: '+r.q.replace(/[,;\\]/g,' '),'TRIGGER:-P30D','END:VALARM','END:VEVENT')});
 L.push('END:VCALENDAR');var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([L.join('\r\n')],{type:'text/calendar'}));a.download='vencimientos-hogar.ics';document.body.appendChild(a);a.click();a.remove()});
// bind generic fields
document.querySelectorAll('[data-k]').forEach(function(el){var k=el.dataset.k;
 if(el.type==='checkbox'){el.checked=!!S[k];el.addEventListener('change',function(){S[k]=el.checked;save()})}
 else{if(S[k]!=null)el.value=S[k];el.addEventListener('input',function(){S[k]=el.value;save();calc()})}});
// calcs
function calc(){
 var o=['Voy a pedirte ayuda para organizar varias áreas de mi vida: tiempo, comida, dinero, papeles y trabajo.','Mi contexto: vivo en '+(S['pf-ciudad']||'[ciudad]')+', con '+(S['pf-con']||'[personas]')+', trabajo en horario '+(S['pf-horario']||'[horario]')+' y mis tareas cambian '+(S['pf-cambio']||'poco')+'.'];
 if(S['pf-extra'])o.push('Además: '+S['pf-extra']+'.');
 o.push('Prefiero respuestas breves, en tablas cuando sea posible. Si te falta información, pregúntame antes de suponer nada. Resume en 8 líneas lo que vas a recordar de mí y espera mi primera petición.');
 $('pf-out').textContent=o.join('\n');
 var neto=num('nm-neto'),pct=num('nm-pct'),fij=num('nm-fijos');
 var ah=neto*(isNaN(pct)?0:pct)/100,dia=neto-ah-(isNaN(fij)?0:fij),sem=dia*12/52;
 $('nm-out').innerHTML=isNaN(neto)?'<div><dt>Escribe tu nómina neta</dt><dd>—</dd></div>':'<div><dt>1 · Ahorro, el día de cobro</dt><dd>'+eur(ah)+'</dd></div><div><dt>2 · Gastos fijos</dt><dd>'+eur(fij||0)+'</dd></div><div><dt>3 · Día a día al mes</dt><dd>'+eur(dia)+'</dd></div><div class="dest"><dt>Tu límite semanal</dt><dd>'+eur(sem)+'</dd></div>';
 var bars=$('nm-barra').children,t=neto>0?neto:1;bars[0].style.width=Math.max(0,ah/t*100)+'%';bars[1].style.width=Math.max(0,(fij||0)/t*100)+'%';bars[2].style.width=Math.max(0,dia/t*100)+'%';
 $('nm-aviso').textContent=(!isNaN(neto)&&dia<0)?'Los gastos fijos y el ahorro superan la nómina. Baja el ahorro o revisa los fijos con P 4.1.':'';
 var pr=num('cs-precio'),en=isNaN(num('cs-entrada'))?20:num('cs-entrada'),ga=isNaN(num('cs-gastos'))?10:num('cs-gastos'),te=num('cs-tengo')||0,me=num('cs-mes')||0;
 if(isNaN(pr)){$('cs-out').innerHTML='<div><dt>Escribe el precio de la vivienda</dt><dd>—</dd></div>'}else{
  var tot=pr*(en+ga)/100,fal=Math.max(0,tot-te),m=me>0?Math.ceil(fal/me):Infinity,f='';
  if(fal===0)f='¡Ya llegas!';else if(isFinite(m)){var d=new Date();d.setMonth(d.getMonth()+m);f=d.toLocaleDateString('es-ES',{month:'long',year:'numeric'})}else f='Añade una aportación mensual';
  $('cs-out').innerHTML='<div><dt>Entrada ('+en+' %)</dt><dd>'+eur(pr*en/100)+'</dd></div><div><dt>Impuestos y gastos ('+ga+' %)</dt><dd>'+eur(pr*ga/100)+'</dd></div><div><dt>Dinero total que necesitas</dt><dd>'+eur(tot)+'</dd></div><div><dt>Te falta</dt><dd>'+eur(fal)+'</dd></div><div class="dest"><dt>Llegas en</dt><dd>'+(isFinite(m)&&fal>0?m+' meses · '+f:f)+'</dd></div>'}
}
calc();
// copy
function copyText(t,b){var old=b.textContent;function ok(){b.textContent='¡Copiado!';setTimeout(function(){b.textContent=old},1600)}
 if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(ok,function(){fallback(t);ok()});else{fallback(t);ok()}}
function fallback(t){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}ta.remove()}
function alertMsg(id,m){var b=$(id),o=b.textContent;b.textContent=m;setTimeout(function(){b.textContent=o},1800)}
var FN={
 menu:function(){return 'MENÚ DE LA SEMANA\n'+dias.map(function(d,i){return d+': '+(S['mn-c'+i]||'—')+' / '+(S['mn-n'+i]||'—')}).join('\n')+'\n\nLISTA DE LA COMPRA\n'+(S['mn-lista']||'')},
 nomina:function(){return $('nm-out').innerText.replace(/\n(?=[^\n]*€)/g,': ')},
 casa:function(){return 'FASE 1 · CUÁNTO NECESITO\n'+$('cs-out').innerText.replace(/\n(?!\n)/g,': ').replace(/: (?=[^:]*: )/g,'\n')+'\n\nFASES\n'+fases.map(function(f,i){return (S['cs-f'+i]?'[x] ':'[ ] ')+(i+1)+' · '+f[0]}).join('\n')},
 hogar:function(){return 'VENCIMIENTOS DEL HOGAR\n'+S.hg.filter(function(r){return r.q}).map(function(r){return r.q+' · '+r.c+' · '+(r.f||'sin fecha')+(r.i?' · '+r.i+' €':'')+(r.f?' · aviso '+aviso(r.f):'')}).join('\n')}};
document.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
 if(b.dataset.copy)copyText($(b.dataset.copy).innerText,b);
 if(b.dataset.copyFn)copyText(FN[b.dataset.copyFn](),b);
 if(b.dataset.print){document.body.dataset.imprimir=b.dataset.print;window.print()}
 if(b.dataset.clear){Object.keys(S).forEach(function(k){if(k.indexOf(b.dataset.clear)===0)delete S[k]});save();document.querySelectorAll('[data-k^="'+b.dataset.clear+'"]').forEach(function(el){el.value=''})}});
window.addEventListener('afterprint',function(){delete document.body.dataset.imprimir});
$('rev-reset').addEventListener('click',function(){rev.forEach(function(_,i){S['rv-'+i]=false});save();document.querySelectorAll('[data-k^="rv-"]').forEach(function(el){el.checked=false})});
})();
