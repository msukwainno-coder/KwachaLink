
/* BeanzNezz frontend demo. Browser storage is not a secure database. */
const BN = (() => {
  const profiles = [
    {id:1,name:"Thoko",age:27,location:"Lilongwe",gender:"Woman",bio:"Book lover, weekend explorer, and believer in honest conversations.",interests:["Books","Travel","Food"],image:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"},
    {id:2,name:"Chisomo",age:30,location:"Blantyre",gender:"Man",bio:"I enjoy live music, trying new places, and building meaningful connections.",interests:["Music","Cooking","Fitness"],image:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"},
    {id:3,name:"Memory",age:25,location:"Zomba",gender:"Woman",bio:"Creative soul who loves nature, laughter, and thoughtful people.",interests:["Nature","Art","Coffee"],image:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"},
    {id:4,name:"Tapiwa",age:32,location:"Mzuzu",gender:"Man",bio:"Entrepreneur, football fan, and curious about the world.",interests:["Football","Business","Travel"],image:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80"},
    {id:5,name:"Lydia",age:29,location:"Mangochi",gender:"Woman",bio:"Beach sunsets, family time, and a good sense of humour matter to me.",interests:["Nature","Family","Food"],image:"https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"},
    {id:6,name:"Patrick",age:28,location:"Lilongwe",gender:"Man",bio:"Easy-going, ambitious, and happiest when discovering a new restaurant.",interests:["Food","Tech","Music"],image:"https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80"}
  ];
  const read = (key, fallback) => { try { const v=localStorage.getItem("bn_"+key); return v?JSON.parse(v):fallback; } catch(e){return fallback;} };
  const write = (key, value) => { try { localStorage.setItem("bn_"+key,JSON.stringify(value)); } catch(e){} };
  const toast = (message) => { let el=document.querySelector(".toast"); if(!el){el=document.createElement("div");el.className="toast";el.setAttribute("role","status");document.body.appendChild(el);} el.textContent=message;el.classList.remove("hidden");clearTimeout(window.__bnToast);window.__bnToast=setTimeout(()=>el.classList.add("hidden"),3500); };
  const liked = () => read("liked",[]);
  const like = (id) => {const arr=liked();if(!arr.includes(id)){arr.push(id);write("liked",arr);toast("Demo like saved on this device.");}else toast("You have already liked this demo profile.");};
  const selectedPlan = () => read("selectedPlan",null);
  const plans = [
    {id:"plan5000",name:"Membership — MK5,000",price:5000,detail:"Details to be confirmed",benefits:["Plan benefits will be confirmed"]},
    {id:"plan10000",name:"Membership — MK10,000",price:10000,detail:"Details to be confirmed",benefits:["Plan benefits will be confirmed"]},
    {id:"plan15000",name:"Membership — MK15,000",price:15000,detail:"Details to be confirmed",benefits:["Plan benefits will be confirmed"]},
    {id:"superelite",name:"Super Elite",price:50000,detail:"Private, non-discoverable profile",benefits:["Private profile excluded from ordinary discovery and search","Additional benefits to be confirmed"]}
  ];
  const money = n => "MK"+Number(n).toLocaleString("en-US");
  const initNav = () => {
    const toggle=document.querySelector(".menu-toggle"), links=document.querySelector(".nav-links");
    if(toggle&&links) toggle.addEventListener("click",()=>{const open=links.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));});
    const page=location.pathname.split("/").pop()||"index.html";
    document.querySelectorAll(".nav-links a").forEach(a=>{if(a.getAttribute("href")===page)a.classList.add("active");});
    const year=document.querySelector("[data-year]");if(year)year.textContent=new Date().getFullYear();
  };
  const renderProfiles = (container, list) => {
    if(!container)return;
    container.innerHTML="";
    if(!list.length){container.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="feature-icon">⌕</div><h3>No profiles found</h3><p>Try widening your age range or choosing another district.</p><button class="secondary" onclick="BN.resetFilters()">Reset filters</button></div>';return;}
    list.forEach(p=>{
      const card=document.createElement("article");card.className="card profile-card";
      card.innerHTML=`<div class="profile-photo"><img src="${p.image}" alt="Sample profile photo for ${p.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;photo-placeholder&quot; aria-label=&quot;Illustrated profile placeholder&quot;>♡</div>'"></div><div class="profile-body"><h3>${p.name}, ${p.age}</h3><div class="muted small">⌖ ${p.location}</div><p>${p.bio}</p><div class="tags">${p.interests.map(x=>`<span class="tag">${x}</span>`).join("")}</div><div class="card-actions"><button data-like="${p.id}" aria-label="Like ${p.name}">♡ Like</button><button class="secondary" data-view="${p.id}">View profile</button></div></div>`;
      container.appendChild(card);
    });
    container.querySelectorAll("[data-like]").forEach(b=>b.addEventListener("click",()=>like(Number(b.dataset.like))));
    container.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{const p=profiles.find(x=>x.id===Number(b.dataset.view));toast(`${p.name}'s public demo profile. Private details are not shown.`);}));
  };
  const resetFilters = () => {["filter-location","filter-gender","filter-min","filter-max","search-name"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});filterProfiles();};
  const filterProfiles = () => {
    const locationVal=(document.getElementById("filter-location")?.value||"").toLowerCase();
    const genderVal=document.getElementById("filter-gender")?.value||"";
    const min=Number(document.getElementById("filter-min")?.value||18), max=Number(document.getElementById("filter-max")?.value||99);
    const q=(document.getElementById("search-name")?.value||"").toLowerCase();
    const filtered=profiles.filter(p=>p.age>=min&&p.age<=max&&(!locationVal||p.location.toLowerCase()===locationVal)&&(!genderVal||p.gender===genderVal)&&(!q||(p.name+" "+p.bio+" "+p.interests.join(" ")).toLowerCase().includes(q)));
    renderProfiles(document.getElementById("profile-results"),filtered);
    const count=document.getElementById("result-count");if(count)count.textContent=`${filtered.length} sample profile${filtered.length===1?"":"s"}`;
  };
  const initBrowse = () => {if(!document.getElementById("profile-results"))return;["filter-location","filter-gender","filter-min","filter-max","search-name"].forEach(id=>document.getElementById(id)?.addEventListener("input",filterProfiles));filterProfiles();};
  const initSignup = () => {
    const form=document.getElementById("signup-form");if(!form)return;
    form.addEventListener("submit",e=>{e.preventDefault();const pass=form.password.value,confirm=form.confirm.value;const dob=new Date(form.dob.value),age=(Date.now()-dob.getTime())/(365.25*86400000);if(pass.length<8){toast("Use a password with at least 8 characters.");return;}if(pass!==confirm){toast("Passwords do not match.");return;}if(!form.dob.value||age<18){toast("BeanzNezz is for adults aged 18 and above.");return;}if(!form.terms.checked){toast("Please accept the terms and community guidelines.");return;}toast("Demo validation passed. No account was created or data sent to a server.");form.reset();});
  };
  const initLogin = () => {const f=document.getElementById("login-form");if(f)f.addEventListener("submit",e=>{e.preventDefault();toast("Demo only: secure sign-in is not connected yet.");});};
  const initProfileWizard = () => {
    const form=document.getElementById("profile-wizard");if(!form)return;
    let current=1;const panes=[...form.querySelectorAll("[data-step-panel]")],steps=[...document.querySelectorAll("[data-step-label]")],bar=document.querySelector(".progress-track span");
    const show=()=>{panes.forEach(p=>p.classList.toggle("hidden",Number(p.dataset.stepPanel)!==current));steps.forEach(s=>{const n=Number(s.dataset.stepLabel);s.classList.toggle("active",n===current);s.classList.toggle("done",n<current);});if(bar)bar.style.width=(current*20)+"%";document.getElementById("wizard-back").classList.toggle("hidden",current===1);document.getElementById("wizard-next").textContent=current===5?"Review & finish":"Continue";};
    document.getElementById("wizard-back").addEventListener("click",()=>{if(current>1){current--;show();}});
    document.getElementById("wizard-next").addEventListener("click",()=>{if(current<5){const pane=panes.find(p=>Number(p.dataset.stepPanel)===current);const required=[...pane.querySelectorAll("[required]")];for(const el of required){if(!el.reportValidity())return;}current++;show();}else{const name=form.publicName.value||"Your public name";const preview=document.getElementById("profile-review");preview.innerHTML=`<h3>${name}</h3><p>${form.bio.value||"Add a short introduction later."}</p><p><strong>Location:</strong> ${form.location.value||"Not selected"} · <strong>Gender:</strong> ${form.gender.value||"Not selected"}</p><p><strong>Interests:</strong> ${form.interests.value||"Not added"}</p><p class="small muted">This is a local preview only. Your profile has not been published.</p>`;document.getElementById("review-panel").classList.remove("hidden");document.getElementById("profile-wizard-fields").classList.add("hidden");}});
    document.getElementById("edit-profile").addEventListener("click",()=>{document.getElementById("review-panel").classList.add("hidden");document.getElementById("profile-wizard-fields").classList.remove("hidden");current=5;show();});
    form.addEventListener("submit",e=>{e.preventDefault();toast("Profile preview complete. Saving and publishing require the future backend.");});
    show();
  };
  const initMembership = () => {
    document.querySelectorAll("[data-select-plan]").forEach(b=>b.addEventListener("click",()=>{const p=plans.find(x=>x.id===b.dataset.selectPlan);write("selectedPlan",p);location.href="payment.html";}));
    const plan=selectedPlan();const out=document.getElementById("payment-plan");
    if(out){if(plan){out.innerHTML=`<h3>${plan.name}</h3><div class="price">${money(plan.price)}</div><p>${plan.detail}</p><ul>${plan.benefits.map(x=>`<li>${x}</li>`).join("")}</ul>`;const hidden=document.getElementById("payment-amount");if(hidden)hidden.value=money(plan.price);}else{out.innerHTML='<p>No plan selected yet. <a href="membership.html">Choose a membership plan</a> first.</p>';document.getElementById("confirm-payment")?.setAttribute("disabled","disabled");}}
    document.getElementById("confirm-payment")?.addEventListener("click",()=>{if(!selectedPlan())return;if(!document.getElementById("payment-confirm")?.checked){toast("Please confirm you understand this is demo mode.");return;}document.getElementById("payment-result").classList.remove("hidden");toast("Demonstration only. No payment was taken and no membership was activated.");});
  };
  const initLikes = () => {const c=document.getElementById("likes-results");if(c)renderProfiles(c,[profiles[2],profiles[4]].map(p=>({...p,bio:"Sample like: "+p.bio})));};
  const initMatches = () => {const c=document.getElementById("matches-results");if(c)renderProfiles(c,[profiles[0],profiles[5]].map(p=>({...p,bio:"Sample mutual match. "+p.bio})));};
  const initMessages = () => {
    const list=document.getElementById("conversation-list"),messages=document.getElementById("chat-messages"),input=document.getElementById("chat-text"),send=document.getElementById("send-message"),rule=document.getElementById("message-rule");
    if(!list||!messages)return;
    const chats=[{id:1,name:"Thoko",initial:"T",history:[["them","Hi! I noticed we both enjoy books."],["mine","Hello Thoko! What have you been reading lately?"]],introSent:false},{id:2,name:"Chisomo",initial:"C",history:[["them","Nice to connect with you." ]],introSent:true}];
    let active=chats[0];
    const draw=()=>{list.innerHTML=chats.map(c=>`<div class="conversation ${c.id===active.id?"active":""}" data-chat="${c.id}" tabindex="0" role="button"><div class="avatar">${c.initial}</div><div><strong>${c.name}</strong><p class="muted">${c.history[c.history.length-1]?.[1]||"New match"}</p></div></div>`).join("");list.querySelectorAll("[data-chat]").forEach(el=>{const act=()=>{active=chats.find(c=>c.id===Number(el.dataset.chat));draw();};el.addEventListener("click",act);el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();act();}});});messages.innerHTML=active.history.map(([who,msg])=>`<div class="bubble ${who==="mine"?"mine":""}">${msg}<small>Demo message</small></div>`).join("");messages.scrollTop=messages.scrollHeight;const limit=active.introSent;rule.innerHTML=limit?'<strong>Introductory message used.</strong> Further messaging requires an eligible paid membership in the real platform. This demo cannot securely enforce entitlements.':'<strong>One introductory message available.</strong> After your first message to this match, further messaging will require eligible membership. This is only a browser demonstration.';if(send)send.disabled=limit; if(input)input.disabled=limit;};
    send?.addEventListener("click",()=>{const text=input.value.trim();if(!text)return;if(active.introSent){toast("Demo limit reached. See membership options.");return;}active.history.push(["mine",text]);active.introSent=true;input.value="";draw();toast("Introductory demo message added locally. It was not sent to another person.");});
    input?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();send?.click();}});draw();
  };
  const initSettings = () => {document.querySelectorAll("[data-demo-toggle]").forEach(btn=>btn.addEventListener("click",()=>{const on=btn.getAttribute("aria-checked")!=="true";btn.setAttribute("aria-checked",String(on));toast("Preview updated on this page only. It has not been saved to a server.");}));document.getElementById("save-settings")?.addEventListener("click",()=>toast("Settings preview acknowledged. Backend saving is not connected."));};
  const initGeneric = () => {
    document.querySelectorAll("[data-demo-action]").forEach(b=>b.addEventListener("click",()=>toast(b.dataset.demoAction||"This is a demonstration. Backend functionality is not connected.")));
    document.querySelectorAll("[data-report]").forEach(b=>b.addEventListener("click",()=>{const reason=prompt("Demo report: briefly describe the concern. Do not enter sensitive information.");if(reason!==null)toast("Demo report preview only. Nothing was sent to a moderation team.");}));
    document.querySelectorAll("[data-block]").forEach(b=>b.addEventListener("click",()=>{if(confirm("Block this sample member in this demonstration?")){b.closest(".card,.list-row")?.classList.add("hidden");toast("Sample member hidden in this page only. Real blocking requires a backend.");}}));
  };
  document.addEventListener("DOMContentLoaded",()=>{initNav();initBrowse();initSignup();initLogin();initProfileWizard();initMembership();initLikes();initMatches();initMessages();initSettings();initGeneric();});
  return {profiles,plans,toast,like,resetFilters,filterProfiles,money};
})();
