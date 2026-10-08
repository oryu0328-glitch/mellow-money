(()=>{'use strict';const KEY='mellow-money-v1.0';const cats={expense:['食費','住居費','交通費','美容・衣服','日用品','医療','趣味・娯楽','通信費','その他'],income:['給与','賞与','副収入','臨時収入','その他']};const colors=['#d49bb0','#a9b9de','#91c7aa','#e6c48e','#bba6d9','#e6a99d','#98c8cf','#d5c1a4','#b0b0b0'];const $=id=>document.getElementById(id);const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};const month=()=>today().slice(0,7);const uid=()=>crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;const initial=()=>({version:1,accounts:[{id:uid(),name:'現金',opening:0}],transactions:[],goals:[],fixed:[],settings:{theme:'honey',budget:0,payday:null,plannedSavings:0,privateMode:false,backupInterval:14,lastBackup:null}});let db;try{db=JSON.parse(localStorage.getItem(KEY))||initial();if(!valid(db))throw Error('invalid')}catch(e){alert('保存データを読み込めません。バックアップから復元してください。');db=initial()}function valid(x){return x&&(!('goals' in x)||Array.isArray(x.goals)&&x.goals.every(g=>typeof g.id==='string'&&typeof g.name==='string'&&Number.isSafeInteger(g.target)&&g.target>0&&Number.isSafeInteger(g.saved)&&g.saved>=0&&typeof g.deadline==='string'))&&(!('fixed' in x)||Array.isArray(x.fixed)&&x.fixed.every(f=>typeof f.id==='string'&&typeof f.name==='string'&&Number.isSafeInteger(f.amount)&&f.amount>0&&Number.isInteger(f.day)&&f.day>=1&&f.day<=31&&typeof f.category==='string'&&typeof f.account==='string'&&x.accounts.some(a=>a.id===f.account)))&&x.version===1&&Array.isArray(x.accounts)&&Array.isArray(x.transactions)&&x.accounts.every(a=>typeof a.id==='string'&&typeof a.name==='string'&&Number.isSafeInteger(a.opening)&&a.opening>=0)&&x.transactions.every(t=>typeof t.id==='string'&&['income','expense','transfer'].includes(t.type)&&Number.isSafeInteger(t.amount)&&t.amount>0&&/^\d{4}-\d{2}-\d{2}$/.test(t.date)&&typeof t.account==='string'&&typeof t.description==='string'&&typeof t.memo==='string'&&typeof t.category==='string'&&typeof t.destination==='string'&&(t.pending===undefined||typeof t.pending==='boolean'))&&new Set(x.accounts.map(a=>a.id)).size===x.accounts.length&&new Set(x.transactions.map(t=>t.id)).size===x.transactions.length&&x.transactions.every(t=>x.accounts.some(a=>a.id===t.account)&&(t.type!=='transfer'||(t.destination!==t.account&&x.accounts.some(a=>a.id===t.destination))))}db.goals=Array.isArray(db.goals)?db.goals:[];db.fixed=Array.isArray(db.fixed)?db.fixed:[];db.settings=db.settings&&typeof db.settings==='object'?db.settings:{theme:'honey',budget:0,payday:null,plannedSavings:0,privateMode:false,backupInterval:14,lastBackup:null};if(!['honey','blush','navy','forest','lavender','sand'].includes(db.settings.theme))db.settings.theme='blush';if(!db.settings.designV16){if(db.settings.theme==='blush')db.settings.theme='honey';db.settings.designV16=true;try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}}if(!Number.isSafeInteger(db.settings.budget)||db.settings.budget<0)db.settings.budget=0;if(!Number.isInteger(db.settings.payday)||db.settings.payday<1||db.settings.payday>31)db.settings.payday=null;if(!Number.isSafeInteger(db.settings.plannedSavings)||db.settings.plannedSavings<0)db.settings.plannedSavings=0;db.settings.privateMode=db.settings.privateMode===true;if(![0,7,14,30].includes(db.settings.backupInterval))db.settings.backupInterval=14;if(typeof db.settings.lastBackup!=='string'||!/^\\d{4}-\\d{2}-\\d{2}$/.test(db.settings.lastBackup))db.settings.lastBackup=null;function save(){try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch(e){alert('保存に失敗しました。端末の空き容量やブラウザ設定を確認してください。');return false}}const yen=n=>'¥'+Math.round(n).toLocaleString('ja-JP');db.transactions.forEach(t=>{if(t.pending===undefined&&t.date>today())t.pending=true});const sorted=()=>[...db.transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.created.localeCompare(a.created));function isActual(t){return t.date<=today()&&t.pending!==true}function actualTransactions(){return db.transactions.filter(isActual)}function balances(){const b=Object.fromEntries(db.accounts.map(a=>[a.id,a.opening]));actualTransactions().forEach(t=>{if(t.type==='income')b[t.account]+=t.amount;if(t.type==='expense')b[t.account]-=t.amount;if(t.type==='transfer'){b[t.account]-=t.amount;b[t.destination]+=t.amount}});return b}function node(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}function go(page){document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id===page));document.querySelectorAll('nav button').forEach(e=>e.classList.toggle('selected',e.dataset.page===page));$('pageTitle').textContent=({home:'My Wallet',history:'History',add:'New Record',analysis:'Analysis',settings:'Settings',calendar:'Calendar',goals:'Savings Goals',fixed:'Fixed Costs'})[page];if(page==='add'&&!$('entryId').value)resetForm();render();window.scrollTo(0,0)}document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));function fillAccounts(){for(const id of ['account','destination']){const el=$(id),v=el.value;el.replaceChildren();db.accounts.forEach(a=>el.add(new Option(a.name,a.id)));if(db.accounts.some(a=>a.id===v))el.value=v}}function fillCategories(){const t=$('type').value,v=$('category').value;$('category').replaceChildren();(cats[t]||['口座間移動']).forEach(c=>$('category').add(new Option(c,c)));if([...$('category').options].some(o=>o.value===v))$('category').value=v;$('destinationLabel').hidden=t!=='transfer'}$('type').addEventListener('change',fillCategories);function resetForm(){$('entryForm').reset();$('entryId').value='';$('entryFixedKey').value='';$('date').value=today();$('entryPending').checked=false;updateEntryDateNotice();$('formTitle').textContent='収支を記録する';$('cancelEdit').hidden=true;fillAccounts();fillCategories()}$('cancelEdit').addEventListener('click',resetForm);function addEntry(t,withActions){const row=node('div','entry');row.append(node('span','entryIcon',t.type==='income'?'♡':t.type==='transfer'?'⇄':'✿'));const main=node('div','entryMain');main.append(node('strong','',t.description||t.category));main.append(node('small','',`${t.date} · ${t.category} · ${isActual(t)?'実績':'未反映'}`));row.append(main);row.append(node('span','entryAmount '+(t.type==='income'?'income':t.type==='expense'?'expense':''),`${t.type==='income'?'+':t.type==='expense'?'−':'⇄'}${yen(t.amount)}`));if(withActions){const actions=node('div','entryActions');const edit=node('button','','編集');edit.addEventListener('click',()=>editEntry(t.id));const del=node('button','','削除');del.addEventListener('click',()=>{if(confirm('この記録を削除しますか？')){const old=db.transactions;db.transactions=old.filter(x=>x.id!==t.id);if(!save())db.transactions=old;render()}});if(!isActual(t)){const confirmBtn=node('button','confirm-entry',t.date>today()?'反映待ち':'反映する');confirmBtn.disabled=t.date>today();confirmBtn.addEventListener('click',()=>{if(!confirm('実際の入出金を確認しましたか？\nこの記録を残高と収支に反映します。'))return;const prev=t.pending;t.pending=false;if(!save()){t.pending=prev;return}render()});actions.append(confirmBtn)}actions.append(edit,del);row.append(actions)}return row}function showList(id,items,actions){const root=$(id);root.replaceChildren();if(!items.length){root.append(node('p','empty','まだ記録がありません ✿'));return}items.forEach(t=>root.append(addEntry(t,actions)))}function render(){const b=balances();$('total').textContent=yen(Object.values(b).reduce((a,v)=>a+v,0));const m=month(),current=actualTransactions().filter(t=>t.date.startsWith(m));const sum=type=>current.filter(t=>t.type===type).reduce((a,t)=>a+t.amount,0);$('incomeTotal').textContent=yen(sum('income'));$('expenseTotal').textContent=yen(sum('expense'));$('netTotal').textContent=(sum('income')-sum('expense')<0?'−':'')+yen(Math.abs(sum('income')-sum('expense')));showList('recent',sorted().filter(isActual).slice(0,5),false);const hm=$('historyMonth').value;showList('historyList',sorted().filter(t=>(!hm||t.date.startsWith(hm))&&($('historyType').value==='all'||t.type===$('historyType').value)&&($('historyStatus').value==='all'||($('historyStatus').value==='actual'?isActual(t):!isActual(t)))&&[t.description,t.memo,t.category].join(' ').toLowerCase().includes(($('historySearch').value||'').trim().toLowerCase())),true);renderAnalysis();renderAccounts();renderCalendar();renderGoals();renderFixed();renderExtras();renderV13();renderUpcoming();renderForecast();renderReconcile()}function editEntry(id){const t=db.transactions.find(x=>x.id===id);if(!t)return;go('add');$('entryId').value=t.id;$('entryFixedKey').value=t.fixedKey||'';$('type').value=t.type;fillCategories();$('category').value=t.category;$('amount').value=t.amount;$('date').value=t.date;$('entryPending').checked=!isActual(t);updateEntryDateNotice();$('account').value=t.account;$('destination').value=t.destination;$('description').value=t.description;$('memo').value=t.memo;$('formTitle').textContent='記録を編集する';$('cancelEdit').hidden=false}function validDate(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T12:00:00');return !isNaN(d)&&`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`===v}$('entryForm').addEventListener('submit',e=>{e.preventDefault();const amount=Number($('amount').value),date=$('date').value,type=$('type').value,account=$('account').value,destination=type==='transfer'?$('destination').value:'';if(!Number.isSafeInteger(amount)||amount<=0||!validDate(date)){alert('正しい金額と日付を入力してください。');return}if(type==='transfer'&&(db.accounts.length<2||account===destination)){alert('振替には異なる2つの口座が必要です。');return}const id=$('entryId').value,old=db.transactions;const prior=old.find(t=>t.id===id);const t={id:id||uid(),created:prior?.created||new Date().toISOString(),type,amount,date,category:$('category').value,account,destination,description:$('description').value.trim(),memo:$('memo').value.trim(),pending:date>today()||$('entryPending').checked,fixedKey:type==='expense'?$('entryFixedKey').value:''};if(t.fixedKey&&old.some(x=>x.id!==id&&x.fixedKey===t.fixedKey)){alert('この月の固定費はすでに支払済みです');return}db.transactions=id?old.map(x=>x.id===id?t:x):[...old,t];if(!save()){db.transactions=old;return}resetForm();go('home')});$('accountForm').addEventListener('submit',e=>{e.preventDefault();const name=$('accountName').value.trim(),opening=Number($('opening').value);if(!name||!Number.isSafeInteger(opening)||opening<0){alert('口座名と初期残高を確認してください。');return}const old=db.accounts;db.accounts=[...old,{id:uid(),name,opening}];if(!save()){db.accounts=old;return}$('accountForm').reset();$('opening').value='0';render()});function renderAccounts(){const root=$('accountsList');root.replaceChildren();const b=balances();db.accounts.forEach(a=>{const row=node('div','accountRow'),name=node('div');name.append(node('strong','',a.name));name.append(node('div','',yen(b[a.id])));row.append(name);const btn=node('button','accountDelete','削除');btn.disabled=db.accounts.length===1||db.transactions.some(t=>t.account===a.id||t.destination===a.id);btn.title=btn.disabled?'取引がある口座や最後の口座は削除できません':'';btn.addEventListener('click',()=>{if(!confirm(`${a.name}を削除しますか？`))return;const old=db.accounts;db.accounts=old.filter(x=>x.id!==a.id);if(!save())db.accounts=old;render()});row.append(btn);root.append(row)});fillAccounts();if($('fixedAccount')){const el=$('fixedAccount'),v=el.value;el.replaceChildren();db.accounts.forEach(a=>el.add(new Option(a.name,a.id)));if(db.accounts.some(a=>a.id===v))el.value=v}}function renderAnalysis(){const m=$('analysisMonth').value||month();const expenses=actualTransactions().filter(t=>t.type==='expense'&&t.date.startsWith(m));const totals={};expenses.forEach(t=>totals[t.category]=(totals[t.category]||0)+t.amount);const entries=Object.entries(totals).sort((a,b)=>b[1]-a[1]);const sum=entries.reduce((a,e)=>a+e[1],0);$('pieCenter').textContent=yen(sum);const legend=$('legend');legend.replaceChildren();if(!sum){$('pie').style.background='#f4e9ed';legend.append(node('div','','支出の記録はありません'))}else{let pct=0;const stops=[];entries.forEach(([name,n],i)=>{const start=pct;pct+=n/sum*100;const color=colors[i%colors.length];stops.push(`${color} ${start}% ${pct}%`);const r=node('div');const dot=node('span','dot');dot.style.background=color;r.append(dot,document.createTextNode(`${name} ${yen(n)}`));legend.append(r)});$('pie').style.background=`conic-gradient(${stops.join(',')})`}$('bars').replaceChildren();const base=new Date(m+'-01T12:00:00');const data=Array.from({length:6},(_,i)=>{const d=new Date(base.getFullYear(),base.getMonth()-5+i,1),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;const ts=actualTransactions().filter(t=>t.date.startsWith(key));return {label:`${d.getMonth()+1}月`,inc:ts.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),out:ts.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)}});const max=Math.max(1,...data.flatMap(d=>[d.inc,d.out]));data.forEach(d=>{const g=node('div','barGroup'),pair=node('div','barPair');for(const [v,cls] of [[d.inc,'in'],[d.out,'out']]){const bar=node('div','bar '+cls);bar.style.height=`${v/max*100}%`;bar.title=yen(v);pair.append(bar)}g.append(pair,node('small','',d.label));$('bars').append(g)})}$('historyMonth').value=month();$('analysisMonth').value=month();$('historyMonth').addEventListener('change',render);$('historyType').addEventListener('change',render);$('historyStatus').addEventListener('change',render);$('historySearch').addEventListener('input',render);$('analysisMonth').addEventListener('change',render);function download(name,text,mime){const blob=new Blob([text],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}$('exportJson').addEventListener('click',()=>{const old=db.settings.lastBackup;db.settings.lastBackup=today();if(!save()){db.settings.lastBackup=old;return}download(`mellow-money-backup-${today()}.json`,JSON.stringify(db,null,2),'application/json');renderV13()});$('exportCsv').addEventListener('click',()=>{const cols=['日付','種類','金額','カテゴリ','口座','振替先','内容','メモ'];const map=Object.fromEntries(db.accounts.map(a=>[a.id,a.name]));const safe=v=>{let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};const rows=sorted().map(t=>[t.date,t.type,t.amount,t.category,map[t.account]||'',map[t.destination]||'',t.description,t.memo].map(safe).join(','));download(`mellow-money-history-${today()}.csv`,'\ufeff'+[cols.map(safe).join(','),...rows].join('\r\n'),'text/csv;charset=utf-8')});$('importJson').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>10*1024*1024)throw Error('ファイルが大きすぎます');const data=JSON.parse(await file.text());if(!valid(data))throw Error('バックアップ形式が正しくありません');if(!confirm('現在のすべてのデータをバックアップで置き換えます。続けますか？'))return;const old=db;db=data;if(!save()){db=old;return}resetForm();render();alert('復元しました')}catch(err){alert('復元できませんでした：'+err.message)}finally{e.target.value=''}});
// v1.1 calendar, savings goals, and monthly payment schedules
const safeText=(tag,txt,cls='')=>node(tag,cls,txt);
$('calendarMonth').value=month();$('fixedMonth').value=month();
let selectedDay=today();
function renderCalendar(){
 const m=$('calendarMonth').value||month(), root=$('calendarGrid');root.replaceChildren();
 const [year,mon]=m.split('-').map(Number);if(!year||mon<1||mon>12)return;
 if(!selectedDay.startsWith(m))selectedDay=m+'-01';const days=new Date(year,mon,0).getDate(),offset=new Date(year,mon-1,1).getDay();
 ['日','月','火','水','木','金','土'].forEach(d=>root.append(safeText('span',d,'cal-head')));
 for(let i=0;i<offset;i++)root.append(node('span','cal-blank'));
 for(let day=1;day<=days;day++){
  const date=m+'-'+String(day).padStart(2,'0');
  const tx=db.transactions.filter(t=>t.date===date);
  const inc=tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const out=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const btn=node('button','cal-day'+(date===selectedDay?' picked':''));btn.type='button';
  btn.append(safeText('strong',String(day)));
  if(inc)btn.append(safeText('small','+'+yen(inc),'cal-in'));if(date>today()&&tx.length)btn.append(safeText('small','予定','cal-planned'));
  if(out)btn.append(safeText('small','−'+yen(out),'cal-out'));
  btn.addEventListener('click',()=>{selectedDay=date;renderCalendar()});root.append(btn);
 }
 if(!selectedDay.startsWith(m))selectedDay=m+'-01';
 $('calendarDayTitle').textContent=selectedDay+' の記録';
 showList('calendarEntries',sorted().filter(t=>t.date===selectedDay),true);
}
$('calendarMonth').addEventListener('change',()=>{selectedDay=$('calendarMonth').value+'-01';renderCalendar()});
function editGoal(g){
 $('goalId').value=g.id;$('goalName').value=g.name;$('goalTarget').value=g.target;
 $('goalSaved').value=g.saved;$('goalDeadline').value=g.deadline;$('goalCancel').hidden=false;go('goals');
}
function resetGoal(){$('goalForm').reset();$('goalId').value='';$('goalSaved').value='0';$('goalCancel').hidden=true}
$('goalCancel').addEventListener('click',resetGoal);
$('goalForm').addEventListener('submit',e=>{
 e.preventDefault();const id=$('goalId').value,target=Number($('goalTarget').value),saved=Number($('goalSaved').value);
 if(!Number.isSafeInteger(target)||target<1||!Number.isSafeInteger(saved)||saved<0){alert('金額を確認してください');return}
 const g={id:id||uid(),name:$('goalName').value.trim(),target,saved,deadline:$('goalDeadline').value};
 if(!g.name||g.deadline&&!validDate(g.deadline)){alert('入力を確認してください');return}
 const old=db.goals;db.goals=id?old.map(x=>x.id===id?g:x):[...old,g];
 if(!save()){db.goals=old;return}resetGoal();render();
});
function renderGoals(){
 const root=$('goalList');root.replaceChildren();
 if(!db.goals.length)root.append(safeText('p','まだ目標がありません ✿','empty'));
 db.goals.forEach(g=>{
  const a=node('article','goal-card');a.append(safeText('h2','♡ '+g.name));
  a.append(safeText('p',yen(g.saved)+' / '+yen(g.target)));
  const track=node('div','goal-track'),bar=node('div','goal-fill');
  bar.style.width=Math.min(100,g.saved/g.target*100)+'%';track.append(bar);a.append(track);
  a.append(safeText('small',Math.round(g.saved/g.target*100)+'% 達成'+(g.deadline?' · 期限 '+g.deadline:'')));
  const actions=node('div','mini-actions'),edit=node('button','secondary','編集'),del=node('button','secondary','削除');
  edit.addEventListener('click',()=>editGoal(g));
  del.addEventListener('click',()=>{if(!confirm('目標を削除しますか？'))return;const old=db.goals;db.goals=old.filter(x=>x.id!==g.id);if(!save())db.goals=old;render()});
  actions.append(edit,del);a.append(actions);root.append(a)
 });
}
cats.expense.forEach(c=>$('fixedCategory').add(new Option(c,c)));
function resetFixed(){$('fixedForm').reset();$('fixedId').value='';$('fixedDay').value='25';$('fixedCancel').hidden=true}
$('fixedCancel').addEventListener('click',resetFixed);
$('fixedForm').addEventListener('submit',e=>{
 e.preventDefault();const id=$('fixedId').value,amount=Number($('fixedAmount').value),day=Number($('fixedDay').value);
 if(!Number.isSafeInteger(amount)||amount<1||!Number.isInteger(day)||day<1||day>31){alert('金額・日付を確認してください');return}
 const f={id:id||uid(),name:$('fixedName').value.trim(),amount,day,category:$('fixedCategory').value,account:$('fixedAccount').value};
 if(!f.name||!db.accounts.some(a=>a.id===f.account))return alert('入力を確認してください');
 const old=db.fixed;db.fixed=id?old.map(x=>x.id===id?f:x):[...old,f];
 if(!save()){db.fixed=old;return}resetFixed();render();
});
function fixedDate(f,m){const [y,mo]=m.split('-').map(Number);return m+'-'+String(Math.min(f.day,new Date(y,mo,0).getDate())).padStart(2,'0')}
function renderFixed(){
 const root=$('fixedList');root.replaceChildren();const m=$('fixedMonth').value||month();
 const paidCount=db.fixed.filter(f=>db.transactions.some(t=>t.fixedKey===f.id+'@'+m&&isActual(t))).length;$('fixedSummary').textContent=db.fixed.length?'実績 '+paidCount+' / '+db.fixed.length+' 件（未来の登録は予定）':'';
 if(!db.fixed.length)root.append(safeText('p','まだ固定費の予定がありません ✿','empty'));
 db.fixed.forEach(f=>{
  const a=node('article');a.append(safeText('h2',f.name));
  a.append(safeText('p',yen(f.amount)+' · 毎月'+f.day+'日（'+fixedDate(f,m)+'）'));
  const actions=node('div','mini-actions');
  const record=node('button','primary','支出に記録'),edit=node('button','secondary','編集'),del=node('button','secondary','削除');
  record.addEventListener('click',()=>{
   if(db.transactions.some(t=>t.fixedKey===f.id+'@'+m)){alert('この月の支払いは登録済みです');return}
   go('add');$('entryFixedKey').value=f.id+'@'+m;$('type').value='expense';fillCategories();$('category').value=f.category;
   $('amount').value=f.amount;$('date').value=fixedDate(f,m);updateEntryDateNotice();$('account').value=f.account;$('description').value=f.name;
  });
  edit.addEventListener('click',()=>{go('fixed');$('fixedId').value=f.id;$('fixedName').value=f.name;$('fixedAmount').value=f.amount;$('fixedDay').value=f.day;$('fixedCategory').value=f.category;$('fixedAccount').value=f.account;$('fixedCancel').hidden=false});
  del.addEventListener('click',()=>{if(!confirm('固定費の予定を削除しますか？'))return;const old=db.fixed;db.fixed=old.filter(x=>x.id!==f.id);if(!save())db.fixed=old;render()});
  const linked=db.transactions.find(t=>t.fixedKey===f.id+'@'+m);const paid=linked&&isActual(linked);record.textContent=linked?(paid?'支払済み ✓':'登録済み・予定 ✓'):'支出に記録';record.disabled=!!linked;actions.append(record,edit,del);a.append(actions);root.append(a);
 });
}
$('fixedMonth').addEventListener('change',renderFixed);

// v1.2: themes, monthly budget, repeat entry, insights and search
function applyTheme(){
 const theme=db.settings.theme;document.documentElement.dataset.theme=theme;
 document.querySelectorAll('[data-theme-choice]').forEach(b=>{b.classList.toggle('chosen',b.dataset.themeChoice===theme);b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme))});
 const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=({honey:'#ffe36c',blush:'#f7dce5',navy:'#172a45',forest:'#d8e8df',lavender:'#eae3f7',sand:'#f5e8d4'})[theme];
}
document.querySelectorAll('[data-theme-choice]').forEach(b=>b.addEventListener('click',()=>{
 const prev=db.settings.theme;db.settings.theme=b.dataset.themeChoice;
 if(!save()){db.settings.theme=prev;return}applyTheme()
}));
$('budgetForm').addEventListener('submit',e=>{
 e.preventDefault();const v=$('monthlyBudget').value.trim(),amount=v===''?0:Number(v);
 if(!Number.isSafeInteger(amount)||amount<0){alert('予算は0以上の整数で入力してください');return}
 const old=db.settings.budget;db.settings.budget=amount;if(!save()){db.settings.budget=old;return}renderExtras();alert('予算を保存しました')
});
function renderExtras(){
 applyTheme();
 const m=month(),budget=db.settings.budget;
 if(document.activeElement!==$('monthlyBudget'))$('monthlyBudget').value=budget||'';
 const expense=actualTransactions().filter(t=>t.type==='expense'&&t.date.startsWith(m)).reduce((n,t)=>n+t.amount,0);
 $('budgetCard').hidden=!budget;
 $('budgetRemaining').textContent=yen(budget-expense);
 $('budgetInfo').textContent='予算 '+yen(budget)+' / 支出 '+yen(expense)+(expense>budget?' · 予算超過':'');
 $('budgetBar').style.width=Math.min(100,expense/budget*100)+'%';
 $('budgetBar').classList.toggle('over',expense>budget);
 const quick=$('quickEntries');quick.replaceChildren();
 const seen=new Set();
 const candidates=sorted().filter(t=>isActual(t)&&t.type!=='transfer').filter(t=>{
  const key=[t.type,t.category,t.account,t.description,t.amount].join('|');
  if(seen.has(key))return false;seen.add(key);return true
 }).slice(0,4);
 if(!candidates.length)quick.append(node('p','empty','記録するとここに再入力候補が表示されます'));
 candidates.forEach(t=>{
  const btn=node('button','quick-item');
  btn.append(node('span','',t.description||t.category),node('strong','',yen(t.amount)));
  btn.addEventListener('click',()=>{
   go('add');$('type').value=t.type;fillCategories();$('category').value=t.category;
   $('amount').value=t.amount;$('date').value=today();$('account').value=t.account;
   $('description').value=t.description;$('memo').value=t.memo;
  });quick.append(btn)
 });
 const am=$('analysisMonth').value||month(),[year,mon]=am.split('-').map(Number);
 const prevDate=new Date(year,mon-2,1);
 const pm=prevDate.getFullYear()+'-'+String(prevDate.getMonth()+1).padStart(2,'0');
 const total=(mm,cat)=>actualTransactions().filter(t=>t.type==='expense'&&t.date.startsWith(mm)&&(!cat||t.category===cat)).reduce((v,t)=>v+t.amount,0);
 const income=actualTransactions().filter(t=>t.type==='income'&&t.date.startsWith(am)).reduce((v,t)=>v+t.amount,0);
 const current=total(am),previous=total(pm),net=income-current;
 const root=$('monthlyReview');root.replaceChildren();
 root.append(node('p','',am+' の収支：'+(net<0?'−':'＋')+yen(Math.abs(net))));
 if(!current&&!previous){root.append(node('p','muted','比較する支出データがまだありません'));return}
 root.append(node('p','',previous?'前月比 '+(current-previous>=0?'＋':'−')+yen(Math.abs(current-previous)):'前月の支出は0円です'));
 const categories=[...new Set(actualTransactions().filter(t=>t.type==='expense'&&t.date.startsWith(am)).map(t=>t.category))];
 const diffs=categories.map(cat=>({cat,diff:total(am,cat)-total(pm,cat)})).sort((a,b)=>b.diff-a.diff);
 if(diffs.length&&diffs[0].diff>0)root.append(node('p','',diffs[0].cat+'が前月より '+yen(diffs[0].diff)+' 増えています'));
}


// v1.3: payday, planned savings, daily allowance, privacy, backup reminders
function salaryDate(year,monthNumber,day){
 const last=new Date(year,monthNumber,0).getDate();
 return `${year}-${String(monthNumber).padStart(2,'0')}-${String(Math.min(day,last)).padStart(2,'0')}`;
}
function nextSalaryDay(day,now=today()){
 const [y,m]=now.split('-').map(Number);
 let date=salaryDate(y,m,day);
 if(date<now){const next=new Date(y,m,1);date=salaryDate(next.getFullYear(),next.getMonth()+1,day)}
 return date;
}
function localDaysBetween(a,b){
 const [ay,am,ad]=a.split('-').map(Number),[by,bm,bd]=b.split('-').map(Number);
 return Math.round((Date.UTC(by,bm-1,bd)-Date.UTC(ay,am-1,ad))/86400000);
}
$('paydayForm').addEventListener('submit',e=>{
 e.preventDefault();const raw=$('payday').value.trim(),day=raw===''?null:Number(raw);
 const savingsRaw=$('plannedSavings').value.trim(),savings=savingsRaw===''?0:Number(savingsRaw);
 if(day!==null&&(!Number.isInteger(day)||day<1||day>31)||!Number.isSafeInteger(savings)||savings<0){alert('給料日は1〜31、貯金額は0以上の整数で入力してください');return}
 const old={...db.settings};db.settings.payday=day;db.settings.plannedSavings=savings;
 if(!save()){db.settings=old;return}renderV13();alert('設定を保存しました')
});
$('privacyToggle').addEventListener('click',()=>{
 const old=db.settings.privateMode;db.settings.privateMode=!old;
 if(!save()){db.settings.privateMode=old;return}renderV13()
});
$('saveBackupInterval').addEventListener('click',()=>{
 const interval=Number($('backupInterval').value);
 if(![0,7,14,30].includes(interval))return;
 const old=db.settings.backupInterval;db.settings.backupInterval=interval;
 if(!save()){db.settings.backupInterval=old;return}renderV13();alert('お知らせ間隔を保存しました')
});
function renderV13(){
 const settings=db.settings,now=today(),payday=settings.payday;
 if(document.activeElement!==$('payday'))$('payday').value=payday??'';
 if(document.activeElement!==$('plannedSavings'))$('plannedSavings').value=settings.plannedSavings||'';
 if(document.activeElement!==$('backupInterval'))$('backupInterval').value=String(settings.backupInterval);
 $('paydayCard').hidden=!payday;
 if(payday){
  const next=nextSalaryDay(payday,now),days=localDaysBetween(now,next);
  $('nextPayday').textContent=days===0?'今日':`あと${days}日`;
  $('paydayInfo').textContent=next+'（予定日・給与は自動入金されません）';
 }
 const budget=settings.budget;
 $('dailyBudgetCard').hidden=!budget;
 if(budget){
  const m=month(),expenses=db.transactions.filter(t=>t.type==='expense'&&t.date.startsWith(m)).reduce((sum,t)=>sum+t.amount,0);
  const [y,mo]=now.split('-').map(Number),last=new Date(y,mo,0).getDate();
  const daysLeft=last-Number(now.slice(-2))+1;
  $('dailyBudget').textContent=yen(Math.floor((budget-expenses)/daysLeft));
  $('dailyBudgetInfo').textContent=`今月の残り${daysLeft}日（今日を含む）で均等に使う目安。マイナスは予算超過です。`;
 }
 $('savingsCard').hidden=!settings.plannedSavings;
 if(settings.plannedSavings){
  $('savingsAmount').textContent=yen(settings.plannedSavings);
  $('savingsInfo').textContent='毎月確保したい金額（目安・口座残高には反映しません）';
 }
 const toggle=$('privacyToggle');toggle.textContent=settings.privateMode?'◉ 金額を表示':'◉ 金額を隠す';
 toggle.setAttribute('aria-pressed',String(settings.privateMode));
 document.body.classList.toggle('privacy-mode',settings.privateMode);
 // Conceal all money values, including dynamically rendered entries, chart labels and account balances.
 document.querySelectorAll('.entryAmount,.accountRow div div,.quick-item strong,.goal-card p,.goal-card small,.barGroup .bar').forEach(el=>el.classList.toggle('private-value',settings.privateMode));
 const last=settings.lastBackup,days=last?localDaysBetween(last,now):null;
 let message=last?'前回のJSONバックアップ：'+last+'（'+Math.max(0,days)+'日前）':'JSONバックアップをまだ作成していません';
 if(settings.backupInterval&&(!last||days>=settings.backupInterval))message+=' ⚠ バックアップをおすすめします';
 $('backupStatus').textContent=message;
 const notice=$('backupNotice');
 if(notice){notice.hidden=!settings.backupInterval||(!!last&&days<settings.backupInterval)}
}
$('date').addEventListener('change',updateEntryDateNotice);
// v1.4: future-dated transactions are plans until their calendar date arrives.
function updateEntryDateNotice(){
 const d=$('date').value;const future=d>today();$('entryPending').disabled=future;if(future)$('entryPending').checked=true;
 $('entryDateNotice').textContent=d&&d>today()?'📅 未来の予定として保存。予定日以降に確認して反映できます。':'今日以前の日付です。予定にチェックを入れた場合は反映されません。';
}
function renderUpcoming(){
 const upcoming=db.transactions.filter(t=>!isActual(t)).sort((a,b)=>a.date.localeCompare(b.date)||a.created.localeCompare(b.created));
 const root=$('upcomingList');root.replaceChildren();
 $('upcomingSummary').textContent=upcoming.length?`未反映の入出金 ${upcoming.length}件（現在の残高には未反映）`:'未反映の入出金はありません';
 $('upcomingCard').hidden=false;
 if(!upcoming.length)return;
 upcoming.slice(0,5).forEach(t=>root.append(addEntry(t,true)));
 if(upcoming.length>5)root.append(node('small','',`ほか ${upcoming.length-5}件は履歴から確認できます`));
}

// v1.5: balance forecasts and auditable reconciliation
function monthEnd(offset){
 const d=new Date();return new Date(d.getFullYear(),d.getMonth()+offset+1,0);
}
function isoLocal(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function projectedBalance(endDate){
 let amount=Object.values(balances()).reduce((a,b)=>a+b,0);
 db.transactions.filter(t=>!isActual(t)&&t.date<=endDate).forEach(t=>{
  if(t.type==='income')amount+=t.amount;
  if(t.type==='expense')amount-=t.amount;
 });
 return amount;
}
function renderForecast(){
 $('forecastThis').textContent=yen(projectedBalance(isoLocal(monthEnd(0))));
 $('forecastNext').textContent=yen(projectedBalance(isoLocal(monthEnd(1))));
}
function fillReconcileAccounts(){
 const el=$('reconcileAccount'),v=el.value;el.replaceChildren();
 db.accounts.forEach(a=>el.add(new Option(a.name,a.id)));
 if(db.accounts.some(a=>a.id===v))el.value=v;
}
function renderReconcile(){
 fillReconcileAccounts();
 const b=balances(),id=$('reconcileAccount').value,amount=b[id]??0;
 $('reconcileCurrent').textContent='帳簿残高：'+yen(amount);
 updateReconcileDiff();
}
function updateReconcileDiff(){
 const raw=$('reconcileActual').value.trim();
 const diff=raw===''?null:Number(raw)-(balances()[$('reconcileAccount').value]??0);
 $('reconcileDiff').textContent=diff===null?'':(!Number.isSafeInteger(diff)?'金額を確認してください':diff===0?'差額なし':'差額：'+(diff>0?'+':'−')+yen(Math.abs(diff)));
}
$('reconcileAccount').addEventListener('change',renderReconcile);
$('reconcileActual').addEventListener('input',updateReconcileDiff);
$('reconcileForm').addEventListener('submit',e=>{
 e.preventDefault();
 const id=$('reconcileAccount').value,actual=Number($('reconcileActual').value),book=balances()[id],diff=actual-book;
 if(!Number.isSafeInteger(actual)||actual<0||!Number.isSafeInteger(diff)||!db.accounts.some(a=>a.id===id)){alert('実際の残高を確認してください');return}
 if(diff===0){alert('差額はありません');return}
 if(!confirm('帳簿残高 '+yen(book)+' → 実際の残高 '+yen(actual)+'\\n差額 '+(diff>0?'+':'−')+yen(Math.abs(diff))+' を調整履歴として記録しますか？'))return;
 const t={id:uid(),created:new Date().toISOString(),type:diff>0?'income':'expense',amount:Math.abs(diff),date:today(),category:'残高調整',account:id,destination:'',description:'口座残高の調整',memo:$('reconcileMemo').value.trim()||'実残高に合わせる調整',pending:false,adjustment:true};
 const old=db.transactions;db.transactions=[...old,t];
 if(!save()){db.transactions=old;return}
 $('reconcileActual').value='';$('reconcileMemo').value='';render();alert('残高を調整しました。履歴から確認できます。')
});
resetForm();render();if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./service-worker.js').catch(()=>{})})();
