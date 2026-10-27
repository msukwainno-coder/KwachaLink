/* KwachaLink shared application script. Supabase project config. */
(() => {
  'use strict';
  const SUPABASE_URL = 'https://pzcudjyjfohlrwkefkhb.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_1Vh1UbqjSUggF7lytzhWHg_q90n-OVt';
  let db = null;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const msg = (form, text, isError=false) => {
    let box = $('[data-form-message]', form);
    if (!box) { box=document.createElement('p'); box.setAttribute('data-form-message',''); form.appendChild(box); }
    box.textContent=text; box.className=isError?'error':'success';
  };
  const val = id => ($('#'+id)?.value || '').trim();
  const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const requireDb = () => { if (!db) throw new Error('Database client did not load. Refresh the page and check the Supabase library.'); return db; };
  async function currentUser(){ const {data,error}=await requireDb().auth.getUser(); if(error) throw error; return data.user; }

  function setupNavigation(){
    const toggle=$('[data-menu-toggle]'), links=$('[data-nav-links]');
    if(toggle&&links) toggle.addEventListener('click',()=>{const open=links.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
    $$('[data-year]').forEach(n=>n.textContent=new Date().getFullYear());
    $$('[data-password-toggle]').forEach(b=>b.addEventListener('click',()=>{const i=$('#'+b.dataset.passwordToggle);if(i){i.type=i.type==='password'?'text':'password';b.textContent=i.type==='password'?'Show':'Hide';}}));
  }
  async function register(){
    const form=$('form[data-local-form]'); if(!form || !$('#confirm') || !$('#name')) return;
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(val('password')!==val('confirm')) return msg(form,'Passwords do not match.',true);
      if(val('password').length<8) return msg(form,'Use a password with at least 8 characters.',true);
      try{
        const client=requireDb();
        const {data,error}=await client.auth.signUp({email:val('email'),password:val('password'),options:{data:{full_name:val('name'),phone:val('phone'),country:val('district'),bio:val('area'),role:val('role')}}});
        if(error) throw error;
        if(data.user){
          // The profile row should be created by the SQL trigger in supabase_setup.sql.
          msg(form,data.session?'Account created. You can now log in.':'Account created. Check your email to confirm it, then log in.');
          form.reset();
        }
      }catch(err){msg(form,err.message||'Registration failed. Please try again.',true);}
    });
  }
  function login(){
    const form=$('form[data-local-form]'); if(!form || !$('#password') || !$('#email') || $('#confirm')) return;
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      try{const {data,error}=await requireDb().auth.signInWithPassword({email:val('email'),password:val('password')});if(error)throw error;msg(form,'You are logged in. Opening your profile…');setTimeout(()=>location.href='profile.html',700);}
      catch(err){msg(form,err.message||'Login failed. Check your email and password.',true);}
    });
  }
  async function loadOffers(){
    const target=$('#market-listings'); if(!target) return;
    try{
      const {data,error}=await requireDb().from('offers').select('id,user_id,offer_type,currency_from,currency_to,exchange_rate,amount,remaining_amount,country,description,status,created_at').eq('status','active').order('created_at',{ascending:false}).limit(60);
      if(error) throw error;
      if(!data.length){target.innerHTML='<p class="empty-state">No live offers yet. Sign in to create the first offer.</p>';return;}
      target.innerHTML=data.map(o=>`<article class="offer-card marketplace-card" data-country="${safe(o.country)}" data-search="${safe([o.currency_from,o.currency_to,o.country,o.description].join(' ').toLowerCase())}" data-kind="${o.offer_type==='buy'?'request':'offer'}"><div class="offer-top"><div class="member-line"><div class="person-avatar">KL</div><div><strong>KwachaLink member</strong><div class="member-sub">Live database listing</div></div></div><span class="tag ${o.offer_type==='buy'?'tag-request':'tag-offer'}">${o.offer_type==='buy'?'Buying currency':'Selling currency'}</span></div><h3>${o.offer_type==='buy'?'Wants to buy':'Has currency to sell'} ${safe(o.currency_from)}</h3><div class="offer-amount">${safe(o.currency_from)} ${Number(o.amount).toLocaleString()} <span>for ${safe(o.currency_to)}</span></div><div class="offer-meta"><span class="tag">${safe(o.country)}</span><span class="tag">Rate: ${Number(o.exchange_rate).toLocaleString()}</span></div><p class="listing-summary">${safe(o.description||'Contact through KwachaLink to discuss terms.')}</p><button class="btn btn-primary detail-gate" data-offer-id="${safe(o.id)}" type="button">Request connection</button></article>`).join('');
      $$('[data-offer-id]',target).forEach(b=>b.addEventListener('click',()=>requestConnection(b.dataset.offerId)));
      filterOffers();
    }catch(err){console.error('Could not load offers:',err.message);const hint=document.createElement('p');hint.className='hint';hint.textContent='Live listings could not be loaded. Check Supabase policies and table columns.';target.prepend(hint);}
  }
  function filterOffers(){const search=($('#market-search')?.value||'').toLowerCase(),kind=$('#market-kind')?.value||'all',country=$('#market-country')?.value||'all';let shown=0;$$('.marketplace-card').forEach(card=>{const ok=(!search||(card.dataset.search||card.textContent).toLowerCase().includes(search))&&(kind==='all'||card.dataset.kind===kind)&&(country==='all'||card.dataset.country===country);card.hidden=!ok;if(ok)shown++;});const empty=$('#market-empty');if(empty)empty.hidden=shown>0;const stat=$('#stat-listings');if(stat)stat.textContent=String(shown);}
  async function requestConnection(offerId){
    try{const user=await currentUser();if(!user){alert('Please log in before requesting a connection.');location.href='login.html';return;}const {data:offer,error:oe}=await requireDb().from('offers').select('user_id').eq('id',offerId).single();if(oe)throw oe;if(offer.user_id===user.id){alert('You cannot request a connection to your own offer.');return;}const {error}=await requireDb().from('connections').insert({offer_id:offerId,requester_id:user.id,offer_owner_id:offer.user_id});if(error)throw error;alert('Connection request sent. The other member can respond when connection permissions are enabled.');}
    catch(err){alert(err.message||'Could not request a connection. Please sign in and try again.');}
  }
  function postOffer(){
    const form=$('form[data-local-form]');if(!form||!$('#postType')||!$('#currency'))return;
    form.addEventListener('submit',async e=>{e.preventDefault();try{const user=await currentUser();if(!user){msg(form,'Please log in before publishing an offer.',true);return;}const amount=Number(val('amount'));if(!(amount>0))throw new Error('Enter an amount greater than zero.');const currency=val('currency');const type=val('postType')==='request'?'buy':'sell';const {error}=await requireDb().from('offers').insert({user_id:user.id,offer_type:type,currency_from:currency,currency_to:'MWK',exchange_rate:1,amount,remaining_amount:amount,country:val('country'),description:[val('purpose'),val('method'),val('details'),val('location')].filter(Boolean).join(' | '),status:'active'});if(error)throw error;msg(form,'Your offer has been published. It should appear in Explore after refreshing.');form.reset();}catch(err){msg(form,err.message||'Could not publish your offer.',true);}});
  }
  async function profile(){
    if(!$('#fullName')&&!location.pathname.endsWith('profile.html'))return;
    const form=$('form[data-local-form]');
    try{const user=await currentUser();if(!user){if(form)msg(form,'Log in to view or update your profile.',true);return;}const {data,error}=await requireDb().from('profiles').select('*').eq('id',user.id).maybeSingle();if(error)throw error;if(data){const map={fullName:'full_name',email:'email',phone:'phone',location:'country',about:'bio'};for(const [id,key] of Object.entries(map)){const el=$('#'+id);if(el&&data[key]!==null&&data[key]!==undefined)el.value=data[key];}}
      if(form&&$('#fullName'))form.addEventListener('submit',async e=>{e.preventDefault();const payload={id:user.id,full_name:val('fullName'),email:user.email,phone:val('phone'),country:val('location'),bio:val('about')};const {error:upErr}=await requireDb().from('profiles').upsert(payload);if(upErr)throw upErr;msg(form,'Profile saved.');});
    }catch(err){if(form)msg(form,err.message||'Could not load profile.',true);}
  }
  async function messages(){
    if(!location.pathname.endsWith('messages.html'))return;
    const container=$('.conversation-list');if(!container)return;
    try{const user=await currentUser();if(!user){container.innerHTML='<p>Please <a href="login.html">log in</a> to view your conversations.</p>';return;}const {data,error}=await requireDb().from('connections').select('id,status,created_at,offer_id,requester_id,offer_owner_id').or(`requester_id.eq.${user.id},offer_owner_id.eq.${user.id}`).order('created_at',{ascending:false});if(error)throw error;if(!data.length){container.innerHTML='<p>No connection requests yet.</p>';return;}container.innerHTML=data.map(c=>`<article class="conversation"><div class="person-avatar">KL</div><div><strong>Connection request</strong><p>Request status: ${safe(c.status)}</p></div><div class="right"><span class="pill">${safe(c.status)}</span><form data-message-form data-connection="${safe(c.id)}"><label class="small" for="msg-${safe(c.id)}">Message</label><input id="msg-${safe(c.id)}" name="message" required maxlength="2000" placeholder="Write a message"><button class="btn btn-primary" type="submit">Send</button></form></div></article>`).join('');$$('[data-message-form]',container).forEach(f=>f.addEventListener('submit',async e=>{e.preventDefault();try{const user=await currentUser();const textVal=f.elements.message.value.trim();const {error:me}=await requireDb().from('messages').insert({connection_id:f.dataset.connection,sender_id:user.id,message_text:textVal});if(me)throw me;f.reset();alert('Message sent.');}catch(err){alert(err.message||'Could not send message.');}}));}
    catch(err){container.innerHTML=`<p>Could not load conversations: ${safe(err.message)}. Check database policies.</p>`;}
  }
  async function init(){
    setupNavigation();
    if(!window.supabase||!window.supabase.createClient){console.error('Supabase library did not load.');return;}
    db=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
    console.log('KwachaLink Supabase client initialized.');
    register();login();postOffer();
    $('#market-search')?.addEventListener('input',filterOffers);$('#market-kind')?.addEventListener('change',filterOffers);$('#market-country')?.addEventListener('change',filterOffers);
    await loadOffers();await profile();await messages();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
