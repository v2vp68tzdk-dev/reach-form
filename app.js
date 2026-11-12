(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const config=window.REACH_CONFIG||{};
const contactLink=$('#telegramContact'),contactHint=$('#telegramHint');
function normalizeTelegram(value){const raw=(value||'').trim();if(!raw)return '';const url=raw.startsWith('@')?'https://t.me/'+raw.slice(1):raw.startsWith('http')?raw:'https://t.me/'+raw;try{const u=new URL(url);if(u.protocol==='https:'&&u.hostname==='t.me'&&u.pathname.split('/').filter(Boolean).length===1&&u.pathname!=='/share')return u.href;}catch{}return ''; }
const telegramUrl=normalizeTelegram(config.telegramUrl);
if(telegramUrl&&contactLink){contactLink.href=telegramUrl;contactLink.hidden=false;if(contactHint)contactHint.textContent='Ссылка откроет публичный Telegram-профиль. Вы сами решаете, что написать.';}


/* Navigation / animations */
const mobileNav=$('#mobileNav');
function toggleMenu(open){if(!mobileNav)return;mobileNav.hidden=!open;$('#menuButton')?.setAttribute('aria-expanded',String(open));}
$('#menuButton')?.addEventListener('click',()=>toggleMenu(mobileNav.hidden));
$$('.wordmark[href="#top"]').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();
  toggleMenu(false);
  if(location.hash)window.history.replaceState(null,'',location.pathname+location.search);
  window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}));
$$('.mobile-nav a').forEach(a=>a.addEventListener('click',()=>toggleMenu(false)));
const revealObserver='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){e.target.classList.add('is-visible');revealObserver.unobserve(e.target);}}},{threshold:0.07}):null;
$$('.reveal,.reveal-photo').forEach(el=>revealObserver?revealObserver.observe(el):el.classList.add('is-visible'));
function progress(){const root=document.documentElement,denom=Math.max(1,root.scrollHeight-window.innerHeight);const el=$('.reading-progress');if(el)el.style.width=(100*scrollY/denom)+'%';}
addEventListener('scroll',progress,{passive:true});progress();

/* Cost estimator — explicitly preliminary studio prices */
const prices={landing:[29900,29900,'Пилотная страница · до 5 блоков'],business:[44900,44900,'Сайт для бизнеса · до 3 страниц'],automation:[9900,9900,'Кликабельный прототип помощника']};
const rouble=n=>n.toLocaleString('ru-RU')+' ₽';
function calc(){const selected=$('#productSelect')?.value||'landing',base=prices[selected]||prices.landing,extras=$$('.extra:checked');const min=base[0]+extras.reduce((sum,n)=>sum+Number(n.dataset.priceMin||0),0),max=base[1]+extras.reduce((sum,n)=>sum+Number(n.dataset.priceMax||n.dataset.priceMin||0),0);$('#calcPrice').textContent=min===max?rouble(min):rouble(min)+'–'+rouble(max);$('#calcBreakdown').textContent=base[2]+(extras.length?' + '+extras.length+' дополнения':'');return {min,max};}
$('#productSelect')?.addEventListener('change',calc);$$('.extra').forEach(el=>el.addEventListener('change',calc));calc();
$$('[data-interest]').forEach(a=>a.addEventListener('click',()=>$('#contact')?.scrollIntoView({behavior:'smooth',block:'start'})));
$('#mobileContactBtn')?.addEventListener('click',()=>{toggleMenu(false);$('#contact')?.scrollIntoView({behavior:'smooth',block:'start'});});
$('#requestCalc')?.addEventListener('click',async()=>{const estimate=calc(),selected=prices[$('#productSelect').value],extras=$$('.extra:checked').map(x=>x.parentElement.querySelector('span')?.textContent||x.value);const summary=`Сфера: ${$('#industrySelect').value}. Задача: ${selected[2]}. Дополнения: ${extras.join(', ')||'нет'}. Предварительная цена: ${estimate.min===estimate.max?rouble(estimate.min):rouble(estimate.min)+'–'+rouble(estimate.max)}. Финальная цена — после уточнения объёма.`;const status=$('#calcStatus');try{await navigator.clipboard.writeText(summary);if(status)status.textContent='Расчёт скопирован. Откройте Telegram и вставьте его в сообщение.';}catch{if(status)status.textContent=summary+' Откройте Telegram, чтобы обсудить задачу.';}$('#contact')?.scrollIntoView({behavior:'smooth',block:'start'});});

/* Scenario model. No client analytics are implied. */
function model(){const inputs=['inquiriesRange','minutesRange','routineRange'].map(x=>$('#'+x));if(inputs.some(x=>!x))return;const n=Number(inputs[0].value),m=Number(inputs[1].value),p=Number(inputs[2].value);$('#inquiriesVal').textContent=n;$('#minutesVal').textContent=m;$('#routineVal').textContent=p+'%';const all=n*m/60,routine=all*p/100,f=x=>x.toLocaleString('ru-RU',{maximumFractionDigits:1})+' ч';$('#hoursResult').textContent=f(routine);$('#allTime').textContent=f(all);$('#routineTime').textContent=f(routine);$('#routineBar').style.width=p+'%';}
$$('#inquiriesRange,#minutesRange,#routineRange').forEach(el=>el.addEventListener('input',model));model();

/* Assist: production API only when explicitly configured, otherwise clear scenario demo */
const chatWindow=$('#chatWindow'),chatTrigger=$('#chatTrigger'),log=$('#chatLog');
function openChat(open){if(!chatWindow)return;chatWindow.hidden=!open;chatTrigger?.setAttribute('aria-expanded',String(open));if(open&&!matchMedia('(max-width:760px)').matches)$('#chatInput')?.focus();}
chatTrigger?.addEventListener('click',()=>openChat(chatWindow.hidden));$('#chatClose')?.addEventListener('click',()=>{openChat(false);chatTrigger?.focus();});$('#openChatFeature')?.addEventListener('click',()=>openChat(true));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&chatWindow&&!chatWindow.hidden){openChat(false);chatTrigger?.focus();}});
const endpoint=typeof config.aiEndpoint==='string'?config.aiEndpoint.trim():'';
const live=Boolean(endpoint),history=[];let busy=false;
$('.chat-head small').textContent=live?'AI API НАСТРОЕН · ПРОВЕРЯЕМ СОЕДИНЕНИЕ':'СЦЕНАРНОЕ ДЕМО · НЕ НЕЙРОСЕТЬ';
$('.chat-note').textContent=live?'Сообщения обрабатываются внешней моделью. Не отправляйте секреты или чувствительные данные.':'Это сценарная демонстрация, не языковая модель. Сообщения остаются в браузере.';
function addMsg(text,user=false,typing=false){const el=document.createElement('div');el.className='chat-message'+(user?' user':'')+(typing?' typing':'');el.textContent=text;log?.append(el);if(log)log.scrollTop=log.scrollHeight;return el;}
addMsg(live?'Здравствуйте! Я Reach / Assist. Расскажите о задаче.':'Здравствуйте! Я демо-помощник Reach & Form. Могу показать услуги, ориентиры стоимости и путь к заявке.');
function canned(q){const t=q.toLowerCase();if(/цен|сколько|стоим|руб|прайс|бюджет/.test(t))return 'Стартовые условия: пилотная страница до 5 блоков — 29 900 ₽ для первых двух проектов; сайт для бизнеса до 3 страниц — от 44 900 ₽; кликабельный прототип помощника без нейросети — 9 900 ₽. Реальный AI пока не подключён и оценивается только после технической проверки.';
if(/заяв|контакт|связ|заказ|начат|хочу|запис/.test(t)){setTimeout(()=>$('#contact')?.scrollIntoView({behavior:'smooth',block:'start'}),250);return telegramUrl?'Открыл раздел контактов. Нажмите кнопку Telegram, чтобы написать напрямую.':'Открыл раздел контактов. Персональная Telegram-ссылка появится после настройки публичного @username.';}
if(/ai|ии|чат|ассист|автомат|бот/.test(t))return 'Умеем проектировать обработку типовых обращений и передачу контакта менеджеру. Вы сейчас общаетесь со сценарным демо, не с настоящей нейросетью. Реальную модель можно подключить отдельно.';
if(/сайт|дизайн|портф|кейс|пример|проект/.test(t))return 'Откройте раздел «Проекты». Там четыре демо Reach & Form: сайт салона красоты, барбершопа, ресторана и студии детейлинга. Можно посмотреть услуги и меню, попробовать запись или бронь.';
if(/привет|здрав|добрый/.test(t))return 'Здравствуйте! Что вас интересует: сайт, автоматизация или оценка бюджета?';return 'Могу рассказать об услугах, цене и демопроектах. Для обсуждения задачи откройте Telegram-кнопку внизу страницы.';}
async function liveReply(q){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),16000);try{const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[...history,{role:'user',content:q}].slice(-12)}),signal:controller.signal});const data=await res.json();if(!res.ok||!data||typeof data.reply!=='string'||!data.reply.trim())throw new Error('Нет ответа');return data.reply.slice(0,2200)}finally{clearTimeout(timer);}}
async function send(q){q=(q||'').trim().slice(0,350);if(!q||busy)return;busy=true;$('#chatInput').value='';$('#chatInput').disabled=true;$('#chatForm button').disabled=true;addMsg(q,true);const loading=addMsg('Подбираю ответ…',false,true);let answer;try{answer=live?await liveReply(q):canned(q);if(live){history.push({role:'user',content:q},{role:'assistant',content:answer});if(history.length>14)history.splice(0,history.length-14)}}catch(e){console.warn('AI response unavailable:',e.message);answer='AI-сервис сейчас недоступен. Для связи используйте Telegram-ссылку внизу страницы.';}finally{loading.remove();addMsg(answer);busy=false;$('#chatInput').disabled=false;$('#chatForm button').disabled=false;if(!chatWindow.hidden&&!matchMedia('(max-width:760px)').matches)$('#chatInput').focus();}}
$('#chatForm')?.addEventListener('submit',e=>{e.preventDefault();send($('#chatInput').value)});$$('[data-q]').forEach(el=>el.addEventListener('click',()=>send(el.dataset.q)));

})();
