/* KwachaLink live dashboard. Uses the existing Supabase project and authenticated user. */
(() => {
  'use strict';
  const SUPABASE_URL = 'https://pzcudjyjfohlrwkefkhb.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1Vh1UbqjSUggF7lytzhWHg_q90n-OVt';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateText = s => { if(!s) return '—'; const d=new Date(s); return Number.isNaN(d.getTime())?'—':d.toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'}); };
  const fmt = n => Number(n || 0).toLocaleString(undefined,{maximumFractionDigits:2});
  const toast=$('#toast'); let toastTimer;
  function notify(message){ if(!toast)return;toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),3000); }
  function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
  const client = window.supabase?.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  let rows=[];
  async function selectCompat(table, columns, filter){
    let q=client.from(table).select(columns);
    if(filter) q=filter(q);
    return await q;
  }
  async function fetchOffers(userId){
    let r=await selectCompat('offers','id,owner_id,direction,source_currency,target_currency,exchange_rate,original_amount,remaining_amount,status,created_at,description,location',q=>q.eq('owner_id',userId).order('created_at',{ascending:false}).limit(100));
    if(r.error && /owner_id|column/i.test(r.error.message||'')) r=await selectCompat('offers','id,user_id,offer_type,currency_from,currency_to,exchange_rate,amount,remaining_amount,status,created_at,description,country',q=>q.eq('user_id',userId).order('created_at',{ascending:false}).limit(100));
    if(r.error) throw r.error;
    return (r.data||[]).map(o=>({id:o.id,kind:'Listing',title:`${o.direction||o.offer_type||'Currency'} · ${o.source_currency||o.currency_from||'—'} → ${o.target_currency||o.currency_to||'—'}`,date:o.created_at,status:o.status||'active',value:'—',search:[o.id,o.direction,o.offer_type,o.source_currency,o.currency_from,o.status].join(' ')}));
  }
  async function fetchConnections(userId){
    const r=await selectCompat('connections','id,requester_id,offer_owner_id,status,created_at',q=>q.or(`requester_id.eq.${userId},offer_owner_id.eq.${userId}`).order('created_at',{ascending:false}).limit(100));
    if(r.error) throw r.error;
    return (r.data||[]).map(c=>({id:c.id,kind:'Connection',title:'Marketplace connection request',date:c.created_at,status:c.status||'pending',value:'—',search:[c.id,c.status,'connection'].join(' ')}));
  }
  async function fetchDeals(userId){
    const r=await selectCompat('deals','id,buyer_id,seller_id,status,created_at,amount,source_currency,target_currency',q=>q.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).order('created_at',{ascending:false}).limit(100));
    if(r.error) {
      // Existing projects may not have the deals table or its policies applied yet.
      console.warn('Deals not available to dashboard:',r.error.message);
      return [];
    }
    return (r.data||[]).map(x=>({id:x.id,kind:'Deal',title:`Deal record · ${x.source_currency||''}${x.target_currency?` → ${x.target_currency}`:''}`,date:x.created_at,status:x.status||'pending',value:x.amount!=null?`${x.source_currency||''} ${fmt(x.amount)}`:'—',search:[x.id,x.status,'deal',x.source_currency,x.target_currency].join(' ')}));
  }
  function statusClass(status){const s=String(status||'').toLowerCase();if(['completed','accepted','active','filled'].includes(s))return 'complete';if(['rejected','cancelled','disputed','failed'].includes(s))return 'failed';return 'pending';}
  function renderTable(){
    const body=$('#txBody');if(!body)return;
    const q=($('#txSearch')?.value||'').toLowerCase().trim(), status=$('#statusFilter')?.value||'all';
    const filtered=rows.filter(r=>(!q||`${r.id} ${r.title} ${r.status} ${r.kind}`.toLowerCase().includes(q))&&(status==='all'||statusClass(r.status)===status));
    body.innerHTML=filtered.map(r=>`<tr data-status="${statusClass(r.status)}"><td class="tx-id">${escapeHtml(String(r.id).slice(0,12))}</td><td><div class="tx-name"><span class="tx-mini">${escapeHtml(r.kind.slice(0,3).toUpperCase())}</span><div><strong>${escapeHtml(r.title)}</strong><small>${escapeHtml(r.kind)} · Live record</small></div></div></td><td>${escapeHtml(dateText(r.date))}</td><td class="amount-neutral">${escapeHtml(r.value)}</td><td><span class="status ${statusClass(r.status)}">${escapeHtml(r.status)}</span></td></tr>`).join('');
    $('#txEmpty').style.display=filtered.length?'none':'block';
    return filtered;
  }
  function renderActivity(){
    const target=$('#liveActivity'); if(!target)return;
    const recent=[...rows].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).slice(0,5);
    target.innerHTML=recent.length?recent.map(r=>`<div class="activity"><span class="activity-icon"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span><div><p><b>${escapeHtml(r.title)}</b><br>${escapeHtml(r.kind)} status: ${escapeHtml(r.status)}</p><small>${escapeHtml(dateText(r.date))}</small></div></div>`).join(''):'<p style="color:#75809a">No account activity yet. Create a listing to get started.</p>';
  }
  async function init(){
    const sidebar=$('#sidebar'),overlay=$('#sidebarOverlay');
    $('#menuToggle')?.addEventListener('click',()=>{sidebar?.classList.toggle('open');overlay?.classList.toggle('show')});
    const closeMenu=()=>{sidebar?.classList.remove('open');overlay?.classList.remove('show')};overlay?.addEventListener('click',closeMenu);
    $('#userBtn')?.addEventListener('click',()=>location.href='profile.html');
    $('#newListingBtn')?.addEventListener('click',()=>location.href='post.html');
    $$('[data-scroll]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();$('#transactions')?.scrollIntoView({behavior:'smooth'});closeMenu()}));
    $('#notificationBtn')?.addEventListener('click',()=>notify('Your latest account records are shown below.'));
    $('#globalSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){const q=e.target.value.trim();$('#txSearch').value=q;renderTable();$('#transactions')?.scrollIntoView({behavior:'smooth'});}});
    $('#txSearch')?.addEventListener('input',renderTable);$('#statusFilter')?.addEventListener('change',renderTable);
    $('#viewAll')?.addEventListener('click',()=>{$('#statusFilter').value='all';$('#txSearch').value='';renderTable();notify('Showing all available account records.')});
    $('#downloadReport')?.addEventListener('click',()=>{const shown=renderTable()||[];const data=[['Reference','Activity','Date','Amount / Value','Status'],...shown.map(r=>[r.id,r.title,dateText(r.date),r.value,r.status])];const csv=data.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='kwachalink-account-activity.csv';a.click();URL.revokeObjectURL(url);notify('Live account activity exported.')});
    $('#activityMore')?.addEventListener('click',()=>{$('#transactions')?.scrollIntoView({behavior:'smooth'});});
    const modal=$('#modalBackdrop');let chosenAction='request';
    function openModal(action){chosenAction=action;$('#modalTitle').textContent=action==='offer'?'Offer currency':'Post a currency request';$('#modalDescription').textContent='Continue to the listing form to publish this on KwachaLink. This does not initiate a payment.';modal?.classList.add('show');$('#amountInput')?.focus()}
    function closeModal(){modal?.classList.remove('show')}
    $$('[data-action]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.action;if(a==='connections'){location.href='explore.html';return}if(a==='messages'){location.href='messages.html';return}openModal(a)}));
    $('#modalCancel')?.addEventListener('click',closeModal);modal?.addEventListener('click',e=>{if(e.target===modal)closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
    $('#quickForm')?.addEventListener('submit',e=>{e.preventDefault();const amount=$('#amountInput').value,currency=$('#currencySelect').value.split(' ')[0];sessionStorage.setItem('kwachalinkDraft',JSON.stringify({type:chosenAction,currency,amount}));closeModal();location.href='post.html'});
    if(!client){notify('Supabase library could not load. Check your internet connection.');return;}
    try{
      const {data:{session},error}=await client.auth.getSession();if(error)throw error;
      if(!session){location.href='login.html?next=dashboard.html';return;}
      const user=session.user;
      setText('accountUserName',user.user_metadata?.full_name||user.email||'KwachaLink member');
      const [offers,connections,deals]=await Promise.all([fetchOffers(user.id),fetchConnections(user.id),fetchDeals(user.id)]);
      rows=[...offers,...connections,...deals].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
      setText('metricListings',String(offers.filter(x=>x.status==='active').length));
      setText('metricConnections',String(connections.length));
      setText('metricPending',String(connections.filter(x=>x.status==='pending').length));
      setText('metricDeals',String(deals.length));
      setText('chartTotal',`${rows.length} records`);
      setText('chartChange','Live account data');
      const chart=$('#activitySummary');if(chart)chart.textContent=rows.length?`${rows.length} live records loaded · ${offers.length} listings · ${connections.length} connections · ${deals.length} deals`:'No records yet. Your dashboard will update when you create listings or connections.';
      renderTable();renderActivity();
    }catch(err){
      console.error(err);setText('chartTotal','Unable to load');setText('chartChange','Check setup');
      const chart=$('#activitySummary');if(chart)chart.textContent=`Could not load account data: ${err.message||'Please check your Supabase setup and table permissions.'}`;
      const body=$('#txBody');if(body)body.innerHTML=`<tr><td colspan="5" style="padding:22px;color:#b42318">Could not load live data. Check that Supabase tables, migrations and row-level security policies are configured.</td></tr>`;
      $('#liveActivity').innerHTML='<p style="color:#b42318">Live account data is unavailable. Please check database setup.</p>';
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();