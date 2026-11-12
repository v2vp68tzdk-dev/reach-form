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
function telegramDraft(message) {
  if (!telegramUrl) return '';
  const url = new URL(telegramUrl);
  url.searchParams.set('text', message);
  return url.href;
}
const heroContact = $('#heroContact');
if (heroContact && telegramUrl) {
  heroContact.href = telegramDraft('Здравствуйте! Хочу обсудить сайт для своего бизнеса.');
}

const estimateLink = $('#requestCalc');
const productSelect = $('#productSelect');
const industrySelect = $('#industrySelect');
function updateEstimate() {
  const [baseMin, baseMax, product] = prices[productSelect.value] || prices.landing;
  const extras = $$('.extra:checked');
  const minimum = extras.reduce((total, input) => total + Number(input.dataset.priceMin), baseMin);
  const maximum = extras.reduce((total, input) => total + Number(input.dataset.priceMax), baseMax);
  const amount = minimum === maximum ? rouble(minimum) : rouble(minimum) + '–' + rouble(maximum);
  $('#calcPrice').textContent = amount;
  $('#calcBreakdown').textContent = product + (extras.length ? ' · дополнений: ' + extras.length : '');

  const extraNames = extras.map(input => input.closest('label').querySelector('span').textContent.trim());
  const message = [
    'Здравствуйте! Хочу обсудить расчёт с сайта Reach & Form.',
    'Сфера: ' + industrySelect.value,
    'Задача: ' + product,
    'Дополнения: ' + (extraNames.join(', ') || 'нет'),
    'Ориентир по стоимости: ' + amount,
  ].join('\n');
  if (telegramUrl) estimateLink.href = telegramDraft(message);
}
[productSelect, industrySelect, ...$$('.extra')].forEach(input => input.addEventListener('change', updateEstimate));
updateEstimate();
$$('[data-interest]').forEach(a=>a.addEventListener('click',()=>$('#contact')?.scrollIntoView({behavior:'smooth',block:'start'})));
$('#mobileContactBtn')?.addEventListener('click',()=>{toggleMenu(false);$('#contact')?.scrollIntoView({behavior:'smooth',block:'start'});});
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
