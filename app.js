document.querySelectorAll('.copiar').forEach(function(b){b.addEventListener('click',function(){
 var t=b.parentElement.querySelector('pre').innerText;
 function ok(){b.textContent='¡Copiado!';b.classList.add('ok');setTimeout(function(){b.textContent='Copiar';b.classList.remove('ok')},1800)}
 function fb(){var r=document.createRange();r.selectNodeContents(b.parentElement.querySelector('pre'));var s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');ok()}catch(e){b.textContent='Selecciona y copia'}}
 if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(ok,fb)}else fb();
})});
(function(){var q=document.getElementById('q'),r=document.getElementById('res');if(!q||!window.PROMPTS)return;
 function norm(x){return x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
 var D=PROMPTS.map(function(p){p.n=norm(p.q);return p});
 q.addEventListener('input',function(){var v=norm(q.value.trim());r.innerHTML='';if(!v){r.hidden=true;return}
  var w=v.split(/\s+/),hits=D.filter(function(p){return w.every(function(x){return p.n.indexOf(x)>-1})}).slice(0,12);
  r.hidden=false;if(!hits.length){r.innerHTML='<li class="vacio">Nada encontrado. Prueba con otra palabra.</li>';return}
  hits.forEach(function(p){var li=document.createElement('li'),a=document.createElement('a');a.href=p.url;
   a.innerHTML='<span class="c"></span><span><b></b><small></small></span>';a.querySelector('.c').textContent=p.code;a.querySelector('b').textContent=p.name;a.querySelector('small').textContent=p.cap;li.appendChild(a);r.appendChild(li)})});
})();
