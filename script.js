document.addEventListener("DOMContentLoaded",()=>{
  const toggle=document.querySelector(".menu-toggle");
  const nav=document.querySelector(".main-nav");
  if(toggle&&nav) toggle.addEventListener("click",()=>nav.classList.toggle("open"));

  const search=document.getElementById("listingSearch");
  const filter=document.getElementById("listingFilter");
  const cards=[...document.querySelectorAll(".listing-card")];
  function filterListings(){
    const term=(search?.value||"").trim().toLowerCase();
    const type=filter?.value||"all";
    cards.forEach(card=>{
      const matchesType=type==="all"||card.dataset.type===type;
      const haystack=((card.dataset.search||"")+" "+card.innerText).toLowerCase();
      card.classList.toggle("hidden",!(matchesType&&haystack.includes(term)));
    });
  }
  search?.addEventListener("input",filterListings);
  filter?.addEventListener("change",filterListings);

  document.querySelectorAll(".demo-form").forEach(form=>{
    form.addEventListener("submit",event=>{
      event.preventDefault();
      const status=form.querySelector(".form-status");
      if(status) status.textContent=form.dataset.message||"This form needs to be connected to the KwachaLink backend.";
    });
  });
  document.querySelectorAll("[data-demo-link]").forEach(link=>link.addEventListener("click",event=>{
    event.preventDefault();
    alert("Password recovery must be connected to the authentication backend.");
  }));
});