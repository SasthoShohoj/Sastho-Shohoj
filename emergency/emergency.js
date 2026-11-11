(() => {
  "use strict";

  if (window.self !== window.top || window.location.search.includes('embed=')) {
    document.documentElement.classList.add('is-embedded');
    if (document.body) document.body.classList.add('is-embedded');
  }

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const state = {
    lang: (window.EasyHealthI18n ? window.EasyHealthI18n.getCurrentLang() : (localStorage.getItem("easyhealth_lang") || localStorage.getItem("sastho_emergency_language") || "en")),
    view: "helplines",
    facilities: [],
    selectedHospital: null,
    selectedAmbulance: null
  };

  const translations = {
    bn: {
      prototype:"সেবা সহায়তা", mainSite:"মূল ওয়েবসাইট", eyebrow:"বাংলাদেশ · জরুরি স্বাস্থ্য সহায়তা",
      headline:"জরুরি মুহূর্তে সঠিক সহায়তা, দ্রুত", intro:"প্রয়োজনীয় জরুরি সেবা বেছে নিন। তাৎক্ষণিক বিপদে সরাসরি জাতীয় জরুরি নম্বরে কল করুন।",
      call999:"জরুরি ৯৯৯", nationalEmergency:"জাতীয় জরুরি সেবা",
      safetyNote:"জীবন-ঝুঁকিপূর্ণ জরুরি অবস্থায় অ্যাপের অপেক্ষা না করে ৯৯৯-এ কল করুন বা নিকটস্থ জরুরি বিভাগে যান। এই ফ্রন্টএন্ড নিজে থেকে অ্যাম্বুলেন্স পাঠায় না।",
      featureHelplines:"জাতীয় জরুরি হেল্পলাইন",featureHelplinesSub:"সরকারি জরুরি নম্বরে সরাসরি কল",
      featureRadar:"কাছাকাছি চিকিৎসা সেবা",featureRadarSub:"বিদ্যমান ম্যাপে হাসপাতাল ও সেবা খুঁজুন",
      featureAmbulance:"অ্যাম্বুলেন্স ও হাসপাতাল",featureAmbulanceSub:"হাসপাতাল, গাড়ি ও চালকের তথ্য দেখুন",
      featureCasualty:"রোগীর জরুরি তথ্য",featureCasualtySub:"আঘাতের ছবি ও রোগীর বিবরণ প্রস্তুত করুন",
      back:"সব অপশন",searchHelpline:"হেল্পলাইন খুঁজুন...",helplineFootnote:"ব্যবহারের আগে সরকারি সূত্র থেকে নম্বর ও সেবার তথ্য যাচাই করুন।",
      sharedMapTitle:"আপনার প্রকল্পের বিদ্যমান স্বাস্থ্যসেবা ম্যাপ",sharedMapText:"ম্যাপটি map/ ফোল্ডার থেকে লোড হচ্ছে। কোনো ডুপ্লিকেট কপি তৈরি করা হয়নি।",
      reloadMap:"ম্যাপ রিফ্রেশ",mapWaiting:"ম্যাপের সাথে সংযোগের অপেক্ষায়...",mapConnected:"বিদ্যমান ম্যাপের সাথে সংযুক্ত।",mapDisclaimer:"ম্যাপের তালিকার তথ্য যাচাই করে ব্যবহার করুন।",
      selectHospitalMap:"ম্যাপে একটি হাসপাতাল নির্বাচন করুন",selectHospitalMapSub:"নির্বাচিত প্রতিষ্ঠানের নাম ও উপলব্ধ তথ্য এখানে দেখানো হবে।",
      providerNoticeTitle:"প্রোভাইডার সংযোগ প্রয়োজন",providerNotice:"এখানে প্রদর্শিত নমুনা অ্যাম্বুলেন্স/চালক বুকিংয়ের জন্য উপলব্ধ নয়। বাস্তব বুকিংয়ের আগে যাচাইকৃত অ্যাম্বুলেন্স অপারেটর যুক্ত করতে হবে।",
      chooseHospital:"হাসপাতাল নির্বাচন",ambulanceOptions:"অ্যাম্বুলেন্সের ধরন",driverDetails:"চালক ও গাড়ির তথ্য",demoOnly:"ডেমো তথ্য",
      driverNotAssigned:"এখনো কোনো যাচাইকৃত চালক বরাদ্দ নেই। অপারেটর সংযুক্ত হলে চালকের পরিচয়, লাইসেন্স যাচাই, ফোন ও গাড়ির নম্বর এখানে দেখানো হবে।",
      hospitalMapHint:"মেডিকেল হেল্প রাডার থেকে হাসপাতাল নির্বাচন করুন অথবা নিচের তালিকা দেখুন।",
      dispatchSafety:"জরুরি অবস্থায় অ্যাম্বুলেন্সের জন্য ৯৯৯ বা সরাসরি যাচাইকৃত স্থানীয় সেবায় যোগাযোগ করুন।",
      requestAmbulance:"অ্যাম্বুলেন্স বুকিং অনুরোধ",uploadTitle:"আঘাতের ছবি আপলোড করুন",uploadSub:"JPEG, PNG বা WebP · সর্বোচ্চ ৫টি ছবি · প্রতিটি ১০ MB পর্যন্ত",
      noPhotos:"কোনো ছবি নির্বাচন করা হয়নি",casualtyNotesTitle:"রোগীর অবস্থা ও জরুরি তথ্য",casualtyNotesSub:"লক্ষণ, আঘাতের স্থান, কীভাবে আঘাত লেগেছে এবং চিকিৎসকের জানা জরুরি তথ্য লিখুন।",
      casualtyPlaceholder:"রোগীর বর্তমান অবস্থা ও আঘাতের বিবরণ লিখুন...",privacyNote:"এই প্রিভিউতে তথ্য সার্ভারে পাঠানো হয় না। সংবেদনশীল ছবি/তথ্য পাঠানোর আগে নিরাপদ হাসপাতাল API ও অনুমোদন ব্যবস্থা যুক্ত করতে হবে।",
      prepareInfo:"তথ্য প্রস্তুত করুন",footerText:"জরুরি সহায়তা · ফ্রন্টএন্ড প্রোটোটাইপ",
      viewHelplines:"জাতীয় জরুরি হেল্পলাইন",viewHelplinesDesc:"প্রয়োজনীয় সেবাটি বেছে সরাসরি কল করুন।",
      viewRadar:"কাছাকাছি চিকিৎসা সেবা",viewRadarDesc:"ম্যাপে হাসপাতাল, ফার্মেসি, ডায়াগনস্টিক ও ব্লাড ব্যাংক খুঁজুন।",
      viewAmbulance:"অ্যাম্বুলেন্স ও হাসপাতাল",viewAmbulanceDesc:"হাসপাতালের তথ্য দেখুন এবং অ্যাম্বুলেন্সের ধরন পর্যালোচনা করুন।",
      viewCasualty:"রোগীর জরুরি তথ্য",viewCasualtyDesc:"শুধু ছবি ও রোগীর অবস্থা/আঘাতের বিবরণ দিন।",
      hospital:"হাসপাতাল",pharmacy:"ফার্মেসি",diagnostic:"ডায়াগনস্টিক",blood:"ব্লাড ব্যাংক",
      address:"ঠিকানা",phone:"ফোন",distance:"দূরত্ব",facilityInfo:"প্রদর্শিত তথ্য",unknown:"যাচাই করা হয়নি",
      basic:"বেসিক অ্যাম্বুলেন্স",bls:"বেসিক লাইফ সাপোর্ট (BLS)",als:"অ্যাডভান্সড লাইফ সাপোর্ট (ALS)",
      basicDesc:"সাধারণ রোগী পরিবহন; চিকিৎসা সরঞ্জাম অপারেটরভেদে ভিন্ন।",blsDesc:"প্রশিক্ষিত সহায়তা ও প্রাথমিক জীবনরক্ষাকারী সরঞ্জাম—প্রোভাইডার দ্বারা নিশ্চিত করতে হবে।",
      alsDesc:"উন্নত পর্যবেক্ষণ/লাইফ-সাপোর্ট—প্রোভাইডার দ্বারা নিশ্চিত করতে হবে।",
      noFacility:"ম্যাপ থেকে কোনো হাসপাতাল তথ্য পাওয়া যায়নি।",photoLimit:"সর্বোচ্চ ৫টি ছবি নির্বাচন করুন।",
      photoInvalid:"প্রতিটি ছবি JPEG, PNG বা WebP এবং সর্বোচ্চ ১০ MB হতে হবে।",
      casualtyReady:"তথ্য যাচাই হয়েছে। এটি শুধু ব্রাউজারে প্রস্তুত করা হয়েছে; হাসপাতালে পাঠানো হয়নি।",
      selectHospitalFirst:"প্রথমে হাসপাতাল নির্বাচন করুন।",selectAmbulanceFirst:"অ্যাম্বুলেন্সের ধরন নির্বাচন করুন।",
      notBookable:"বাস্তব বুকিং চালু নেই। যাচাইকৃত অ্যাম্বুলেন্স অপারেটর ও বুকিং API যুক্ত করতে হবে।",
      selected:"নির্বাচিত",noPhone:"ফোন নম্বর দেওয়া নেই",hospitalSelected:"হাসপাতাল নির্বাচন করা হয়েছে"
    },
    en: {
      prototype:"Emergency support",mainSite:"Main website",eyebrow:"BANGLADESH · EMERGENCY HEALTH SUPPORT",
      headline:"The right help, faster when it matters",intro:"Choose the emergency service you need. For immediate danger, call the national emergency number directly.",
      call999:"SOS 999",nationalEmergency:"National Emergency Service",
      safetyNote:"For life-threatening emergencies, do not wait for the app. Call 999 or go to the nearest emergency department. This frontend does not dispatch ambulances.",
      featureHelplines:"National emergency helplines",featureHelplinesSub:"Direct calls to government helplines",
      featureRadar:"Nearby medical services",featureRadarSub:"Find hospitals and services on the existing map",
      featureAmbulance:"Ambulance & hospital",featureAmbulanceSub:"View hospital, vehicle and driver information",
      featureCasualty:"Patient casualty information",featureCasualtySub:"Prepare injury photos and patient notes",
      back:"All options",searchHelpline:"Search helplines...",helplineFootnote:"Verify numbers and service descriptions against official sources before production.",
      sharedMapTitle:"Your project's existing medical map",sharedMapText:"The map loads directly from the map/ folder. No duplicate map is created.",
      reloadMap:"Reload map",mapWaiting:"Waiting for map connection...",mapConnected:"Connected to the existing map.",mapDisclaimer:"Verify facility details before relying on them.",
      selectHospitalMap:"Select a hospital on the map",selectHospitalMapSub:"The selected facility and available information will appear here.",
      providerNoticeTitle:"Provider integration required",providerNotice:"Ambulance and driver entries shown here are not bookable. A verified ambulance operator must be integrated before real bookings.",
      chooseHospital:"Choose a hospital",ambulanceOptions:"Ambulance type",driverDetails:"Driver & vehicle information",demoOnly:"Demo information",
      driverNotAssigned:"No verified driver is assigned. Once an operator is connected, driver identity, licence verification, phone and vehicle registration can appear here.",
      hospitalMapHint:"Choose a hospital in Medical Help Radar or select one from the list below.",
      dispatchSafety:"For urgent transport, call 999 or contact a verified local ambulance provider directly.",
      requestAmbulance:"Request ambulance booking",uploadTitle:"Upload injury photos",uploadSub:"JPEG, PNG or WebP · Up to 5 photos · 10 MB each",
      noPhotos:"No photos selected",casualtyNotesTitle:"Patient condition & emergency information",casualtyNotesSub:"Describe symptoms, injury location, how it happened and other information clinicians should know.",
      casualtyPlaceholder:"Describe the patient's current condition and injuries...",privacyNote:"This preview does not send data to a server. Secure hospital APIs and authorization are required before transmitting sensitive photos or information.",
      prepareInfo:"Prepare information",footerText:"Emergency support · Frontend prototype",
      viewHelplines:"National emergency helplines",viewHelplinesDesc:"Choose the service you need and call directly.",
      viewRadar:"Nearby medical services",viewRadarDesc:"Find hospitals, pharmacies, diagnostics and blood banks on the map.",
      viewAmbulance:"Ambulance & hospital",viewAmbulanceDesc:"Review hospital information and ambulance types.",
      viewCasualty:"Patient casualty information",viewCasualtyDesc:"Enter only photos and a description of the patient's condition/injuries.",
      hospital:"Hospital",pharmacy:"Pharmacy",diagnostic:"Diagnostic",blood:"Blood bank",
      address:"Address",phone:"Phone",distance:"Distance",facilityInfo:"Facility information",unknown:"Not verified",
      basic:"Basic ambulance",bls:"Basic life support (BLS)",als:"Advanced life support (ALS)",
      basicDesc:"General patient transport; equipment varies by operator.",blsDesc:"Trained support and basic life-support equipment—must be confirmed by provider.",
      alsDesc:"Advanced monitoring/life-support—must be confirmed by provider.",
      noFacility:"No hospital information has been received from the map.",photoLimit:"Select no more than 5 photos.",
      photoInvalid:"Each photo must be JPEG, PNG or WebP and no larger than 10 MB.",
      casualtyReady:"Information validated. It is prepared in this browser only; it has not been sent to a hospital.",
      selectHospitalFirst:"Choose a hospital first.",selectAmbulanceFirst:"Choose an ambulance type first.",
      notBookable:"Real booking is not enabled. A verified ambulance operator and booking API are required.",
      selected:"Selected",noPhone:"No phone number provided",hospitalSelected:"Hospital selected"
    }
  };

  const helplines = [
    ["National Emergency Service","জাতীয় জরুরি সেবা","999","Police, fire and ambulance emergency response.","পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স জরুরি সহায়তা।"],
    ["Fire Service & Civil Defence","ফায়ার সার্ভিস ও সিভিল ডিফেন্স","102","Fire and rescue service. For urgent emergencies, 999 is also available.","অগ্নিকাণ্ড ও উদ্ধার সহায়তা। জরুরি প্রয়োজনে ৯৯৯-ও ব্যবহার করুন।"],
    ["Health Batayon","স্বাস্থ্য বাতায়ন","16263","Health advice and medical guidance.","স্বাস্থ্য পরামর্শ ও চিকিৎসা নির্দেশনা।"],
    ["Disaster Early Warning","দুর্যোগের আগাম সতর্কবার্তা","1090","Disaster-related information and warnings.","দুর্যোগ সম্পর্কিত তথ্য ও সতর্কবার্তা।"],
    ["Women & Children Protection","নারী ও শিশু সহায়তা","109","Support for violence against women and children.","নারী ও শিশু নির্যাতন প্রতিরোধে সহায়তা।"],
    ["Child Helpline","শিশু সহায়তা","1098","Support for children needing protection.","সুরক্ষা প্রয়োজন এমন শিশুদের সহায়তা।"],
    ["Government Information Service","সরকারি তথ্য ও সেবা","333","Government service information.","সরকারি সেবা সম্পর্কিত তথ্য।"],
    ["Government Legal Aid","জাতীয় আইনগত সহায়তা","16430","Government legal aid information.","সরকারি আইনগত সহায়তা সম্পর্কিত তথ্য।"]
  ];

  const ambulanceTypes = [
    {id:"basic",key:"basic",desc:"basicDesc"},
    {id:"bls",key:"bls",desc:"blsDesc"},
    {id:"als",key:"als",desc:"alsDesc"}
  ];

  const t = key => translations[state.lang][key] || key;
  const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const setMessage = (id, message) => { const el=$("#"+id); el.textContent=message; el.hidden=false; };

  function setLanguage(lang) {
    if (lang !== "en" && lang !== "bn") return;
    state.lang = lang;
    try {
      localStorage.setItem("easyhealth_lang", lang);
      localStorage.setItem("sastho_emergency_language", lang);
    } catch(e) {}
    document.documentElement.lang = lang;

    if (window.EasyHealthI18n && window.EasyHealthI18n.getCurrentLang() !== lang) {
      window.EasyHealthI18n.setLanguage(lang);
    }

    $$("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (translations[lang] && translations[lang][key]) el.textContent = t(key);
      else if (window.EasyHealthI18n) {
        const tr = window.EasyHealthI18n.t(key);
        if (tr) el.textContent = tr;
      }
    });

    $$("[data-i18n-placeholder]").forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (translations[lang] && translations[lang][key]) el.placeholder = t(key);
      else if (window.EasyHealthI18n) {
        const tr = window.EasyHealthI18n.t(key);
        if (tr) el.placeholder = tr;
      }
    });

    $$(".lang-opt").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });

    renderHelplines($("#helplineSearch") ? $("#helplineSearch").value : "");
    renderAmbulanceChoices();
    renderHospitalChoices();
    updateWorkspaceHeading();
    if (state.selectedHospital) renderSelectedHospital(state.selectedHospital);

    // Broadcast to embedded shared map frame
    const frame = $("#sharedMapFrame");
    if (frame && frame.contentWindow) {
      try {
        frame.contentWindow.postMessage({ type: "SASTHO_SET_LANGUAGE", lang }, "*");
      } catch (err) {}
    }
  }

  function showView(view, shouldScroll = true) {
    state.view=view;
    $$(".feature-card").forEach(card => {
      const active=card.dataset.view===view;
      card.classList.toggle("active",active);
      card.setAttribute("aria-pressed",String(active));
    });
    $$(".view-panel").forEach(panel => panel.hidden=panel.dataset.panel!==view);
    if (shouldScroll && window.self === window.top) {
      $("#workspace").scrollIntoView({behavior:"smooth",block:"start"});
    }
    updateWorkspaceHeading();
    if(view==="radar") setTimeout(()=> {
      const frame=$("#sharedMapFrame");
      try { frame.contentWindow.postMessage({type:"SASTHO_MAP_RESIZE"},location.origin); } catch {}
    },250);
  }

  function updateWorkspaceHeading() {
    const data = {
      helplines:["viewHelplines","viewHelplinesDesc","01 / "+(state.lang==="bn"?"জরুরি যোগাযোগ":"EMERGENCY CONTACTS")],
      radar:["viewRadar","viewRadarDesc","02 / "+(state.lang==="bn"?"মেডিকেল রাডার":"MEDICAL RADAR")],
      ambulance:["viewAmbulance","viewAmbulanceDesc","03 / "+(state.lang==="bn"?"অ্যাম্বুলেন্স সেবা":"AMBULANCE SERVICE")],
      casualty:["viewCasualty","viewCasualtyDesc","04 / "+(state.lang==="bn"?"রোগীর তথ্য":"PATIENT INFORMATION")]
    }[state.view];
    $("#viewTitle").textContent=t(data[0]);
    $("#viewDescription").textContent=t(data[1]);
    $("#viewEyebrow").textContent=data[2];
  }

  function renderHelplines(query="") {
    const q=query.trim().toLowerCase();
    const items=helplines.filter(row=>row.join(" ").toLowerCase().includes(q));
    $("#helplineList").innerHTML=items.map(row=>`
      <article class="helpline-card">
        <h3>${safe(state.lang==="bn"?row[1]:row[0])}</h3>
        <div class="bn-name">${safe(state.lang==="bn"?row[0]:row[1])}</div>
        <div class="number">${safe(row[2])}</div>
        <p>${safe(state.lang==="bn"?row[4]:row[3])}</p>
        <a class="call-link" href="tel:${safe(row[2])}">☎ ${state.lang==="bn"?"কল করুন":"Call"} ${safe(row[2])}</a>
      </article>`).join("") || `<p class="muted">${state.lang==="bn"?"কোনো নম্বর পাওয়া যায়নি।":"No matching helplines found."}</p>`;
  }

  function normalizeFacility(raw) {
    if(!raw || typeof raw!=="object") return null;
    const lat=Number(raw.lat), lng=Number(raw.lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)) return null;
    return {
      id:String(raw.id||""), name:String(raw.name||"Unnamed facility"),
      category:String(raw.category||"").toUpperCase(), address:String(raw.address||""),
      phone:String(raw.phone||""), lat,lng, meta1Text:String(raw.meta1Text||""),
      meta2Text:String(raw.meta2Text||""), badgeText:String(raw.badgeText||"")
    };
  }

  function receiveFacilities(list) {
    if(!Array.isArray(list)) return;
    state.facilities=list.map(normalizeFacility).filter(Boolean);
    renderHospitalChoices();
    $("#mapConnection").textContent=t("mapConnected");
  }

  function facilityCategory(f) {
    if(f.category==="HOSPITAL") return t("hospital");
    if(f.category==="PHARMACY") return t("pharmacy");
    if(f.category==="DIAGNOSTIC") return t("diagnostic");
    if(f.category==="BLOOD_BANK") return t("blood");
    return f.category;
  }

  function renderSelectedHospital(f) {
    $("#mapSelectedHospital").innerHTML=`
      <div class="empty-icon">✚</div>
      <div><strong>${safe(f.name)}</strong>
      <p>${safe(f.address||t("unknown"))} · ${safe(f.meta1Text||t("unknown"))}</p>
      <p>${safe(t("phone"))}: ${f.phone?`<a href="tel:${safe(f.phone)}">${safe(f.phone)}</a>`:safe(t("noPhone"))}</p></div>`;
  }

  function selectHospital(f) {
    state.selectedHospital=f;
    renderSelectedHospital(f);
    renderHospitalChoices();
    $("#bookingMessage").hidden=true;
  }

  function renderHospitalChoices() {
    const hospitals=state.facilities.filter(f=>f.category==="HOSPITAL");
    const container=$("#hospitalChoices");
    if(!hospitals.length) {
      container.innerHTML=`<p class="muted">${safe(t("noFacility"))}</p>`;
      return;
    }
    container.innerHTML=hospitals.map(f=>`
      <button class="choice-item ${state.selectedHospital?.id===f.id?"selected":""}" type="button" data-hospital-id="${safe(f.id)}">
        <strong>${safe(f.name)}</strong>
        <small>${safe(f.address)} · ${safe(f.meta2Text||t("unknown"))}</small>
        <small>${safe(f.meta1Text||t("facilityInfo")+": "+t("unknown"))}</small>
      </button>`).join("");
    $$("[data-hospital-id]",container).forEach(btn=>btn.addEventListener("click",()=>{
      const f=hospitals.find(x=>x.id===btn.dataset.hospitalId); if(f) selectHospital(f);
    }));
  }

  function renderAmbulanceChoices() {
    $("#ambulanceChoices").innerHTML=ambulanceTypes.map(item=>`
      <button class="ambulance-option ${state.selectedAmbulance===item.id?"selected":""}" type="button" data-ambulance="${item.id}">
        <strong>${safe(t(item.key))}</strong><small>${safe(t(item.desc))}</small>
      </button>`).join("");
    $$("[data-ambulance]").forEach(btn=>btn.addEventListener("click",()=>{
      state.selectedAmbulance=btn.dataset.ambulance;
      renderAmbulanceChoices();
      const item=ambulanceTypes.find(x=>x.id===state.selectedAmbulance);
      $("#ambulanceDetails").hidden=false;
      $("#ambulanceDetails").innerHTML=`<dl><dt>${safe(t("ambulanceOptions"))}</dt><dd>${safe(t(item.key))}</dd><dt>${safe(t("facilityInfo"))}</dt><dd>${safe(t("unknown"))}</dd></dl>`;
      $("#requestAmbulance").disabled=false;
      renderDriverPlaceholder();
    }));
  }

  function renderDriverPlaceholder() {
    const el=$("#driverDetails");
    el.className="driver-empty";
    el.textContent=t("driverNotAssigned");
  }

  function connectMapFrame() {
    const frame=$("#sharedMapFrame");
    frame.addEventListener("load",()=>{
      try {
        const child=frame.contentWindow;
        if(child && typeof child.easyHealthGetFacilities==="function") {
          receiveFacilities(child.easyHealthGetFacilities());
          $("#mapConnection").textContent=t("mapConnected");
        } else {
          $("#mapConnection").textContent=state.lang==="bn"
            ?"ম্যাপ লোড হয়েছে; facility bridge যোগ করতে map/app.js আপডেট করুন।"
            :"Map loaded; add the facility bridge to map/app.js.";
        }
      } catch {
        $("#mapConnection").textContent=state.lang==="bn"?"ম্যাপ সংযোগে সমস্যা হয়েছে।":"Unable to read map data.";
      }
    });
    window.addEventListener("message",event=>{
      if(location.origin && location.origin!=="null" && event.origin && event.origin!==location.origin) return;
      const msg=event.data||{};
      if(msg.type==="SASTHO_MAP_FACILITIES") {
        receiveFacilities(msg.facilities);
        $("#mapConnection").textContent=t("mapConnected");
      }
      if(msg.type==="SASTHO_MAP_FACILITY_SELECTED") {
        const f=normalizeFacility(msg.facility);
        if(f) {
          if(!state.facilities.some(x=>x.id===f.id)) state.facilities.push(f);
          selectHospital(f);
        }
      }
    });
  }

  function handleCasualtySubmit(event) {
    event.preventDefault();
    const files=$("#casualtyPhotos").files;
    const notes=$("#casualtyNotes").value.trim();
    if(files.length>5) return setMessage("casualtyMessage",t("photoLimit"));
    const allowed=["image/jpeg","image/png","image/webp"];
    for(const file of files) {
      if(!allowed.includes(file.type)||file.size>10*1024*1024) return setMessage("casualtyMessage",t("photoInvalid"));
    }
    if(!notes) { $("#casualtyNotes").focus(); return; }
    setMessage("casualtyMessage",t("casualtyReady"));
  }

  function init() {
    const initialLang = (window.EasyHealthI18n ? window.EasyHealthI18n.getCurrentLang() : (localStorage.getItem("easyhealth_lang") || localStorage.getItem("sastho_emergency_language") || "en"));
    setLanguage(initialLang);
    showView("helplines", false);
    $$(".feature-card").forEach(card=>card.addEventListener("click",()=>showView(card.dataset.view, true)));
    $("#backToOptions").addEventListener("click", () => {
      const grid = $(".feature-grid");
      if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });
    
    // Wire segmented lang toggle buttons
    $$(".lang-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        const l = btn.getAttribute("data-lang");
        setLanguage(l);
      });
    });

    // Subscribe to EasyHealthI18n changes
    if (window.EasyHealthI18n) {
      window.EasyHealthI18n.onLanguageChange(lang => {
        if (lang !== state.lang) setLanguage(lang);
      });
    }

    $("#helplineSearch").addEventListener("input",e=>renderHelplines(e.target.value));
    $("#refreshMap").addEventListener("click",()=>$("#sharedMapFrame").contentWindow.location.reload());
    $("#casualtyForm").addEventListener("submit",handleCasualtySubmit);
    $("#casualtyPhotos").addEventListener("change",e=>{
      const files=[...e.target.files];
      $("#photoNames").textContent=files.length?files.map(f=>f.name).join(", "):t("noPhotos");
    });
    $("#requestAmbulance").addEventListener("click",()=>{
      if(!state.selectedHospital) return setMessage("bookingMessage",t("selectHospitalFirst"));
      if(!state.selectedAmbulance) return setMessage("bookingMessage",t("selectAmbulanceFirst"));
      setMessage("bookingMessage",t("notBookable"));
    });
    connectMapFrame();
    renderHelplines();
    renderAmbulanceChoices();
    renderDriverPlaceholder();
  }
  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init):init();
})();
