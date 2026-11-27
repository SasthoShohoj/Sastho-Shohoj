(function () {
  "use strict";

  const fallback = {
    name: "Ayesha Rahman", dob: "1994-03-12", blood: "A+", hometown: "Chattogram",
    address: "House 18, Road 7, Dhanmondi, Dhaka", profession: "Teacher", religion: "Islam",
    nid: "1987456321098", email: "ayesha.rahman@example.com", phone: "+880 1712-345678",
    whatsapp: "+880 1812-345678", location: "Dhaka, Bangladesh", avatar: ""
  };
  let profile = loadProfile();
  const reports = [
    ["🧪", "Complete Blood Count (CBC)", "18 Feb 2025", "Square Hospital Diagnostic Center", "Haemoglobin: 13.2 g/dL\nWBC Count: 7,800 /µL\nPlatelet Count: 265,000 /µL\nConclusion: All values are within the reference range."],
    ["◉", "Lipid Profile", "18 Feb 2025", "Square Hospital Diagnostic Center", "Total Cholesterol: 172 mg/dL\nHDL Cholesterol: 54 mg/dL\nLDL Cholesterol: 96 mg/dL\nConclusion: Desirable lipid profile."],
    ["◒", "Blood Glucose Test", "04 Jan 2025", "Ibn Sina Diagnostic Center", "Fasting Blood Glucose: 5.1 mmol/L\nHbA1c: 5.4%\nConclusion: Results are within the normal range."],
    ["◌", "Liver Function Test", "04 Jan 2025", "Ibn Sina Diagnostic Center", "ALT: 24 U/L\nAST: 22 U/L\nTotal Bilirubin: 0.8 mg/dL\nConclusion: Liver function appears normal."],
    ["⌁", "Thyroid Function Test", "22 Nov 2024", "Popular Diagnostic Center", "TSH: 2.45 mIU/L\nFree T4: 1.21 ng/dL\nConclusion: Euthyroid status."]
  ].map(toRecord);
  const prescriptions = [
    ["💊", "Dr. Nusrat Jahan", "Medicine Specialist", "18 Feb 2025", "Square Hospital", "Diagnosis: Seasonal allergic rhinitis\nMedicines:\n• Cetirizine 10 mg — once daily at night — 10 days\n• Saline nasal spray — twice daily — 14 days\nInstructions: Take after food. Stay hydrated.\nFollow-up: Return if symptoms continue after 10 days."],
    ["💊", "Dr. Farhan Kabir", "General Physician", "04 Jan 2025", "Ibn Sina Hospital", "Diagnosis: Acute gastritis\nMedicines:\n• Omeprazole 20 mg — once daily before breakfast — 14 days\n• Antacid suspension — after meals as needed — 7 days\nInstructions: Avoid spicy food and caffeine.\nFollow-up: Review in two weeks."]
  ].map(toRecord);
  const visits = [
    ["◷", "Dr. Nusrat Jahan", "Medicine Specialist", "26 Mar 2025", "Square Hospital", "Upcoming", "10:30 AM", "Visit type: In-person consultation\nReason: Follow-up consultation\nAppointment status: Confirmed\nNotes: Please arrive 15 minutes early."],
    ["◷", "Dr. Arif Hossain", "Cardiologist", "15 Apr 2025", "Labaid Specialized Hospital", "Upcoming", "04:00 PM", "Visit type: Video consultation\nReason: Routine heart health review\nAppointment status: Confirmed\nNotes: Video link will be available before the visit."],
    ["✓", "Dr. Farhan Kabir", "General Physician", "04 Jan 2025", "Ibn Sina Hospital", "Completed", "11:00 AM", "Visit type: In-person consultation\nReason: Stomach discomfort\nAppointment status: Completed\nNotes: Prescription issued."],
    ["✓", "Dr. Sadia Ahmed", "Dermatologist", "21 Nov 2024", "Popular Diagnostic Center", "Completed", "06:30 PM", "Visit type: In-person consultation\nReason: Skin allergy\nAppointment status: Completed\nNotes: Follow-up completed."]
  ].map(toRecord);
  const demoLocations = {
    kuet: { name: "KUET, Khulna", latitude: 22.9006, longitude: 89.5024 },
    boyra: { name: "Boyra, Khulna", latitude: 22.8436, longitude: 89.5412 },
    sonadanga: { name: "Sonadanga, Khulna", latitude: 22.8285, longitude: 89.5510 },
    sadar: { name: "Khulna Sadar", latitude: 22.8115, longitude: 89.5665 }
  };
  const doctorsData = [
    ["doctor-001","Dr. Maya Sen","Cardiology","Fictional Care Hospital","Panthapath, Dhaka",23.7515,90.3912,"MBBS, FCPS","12 years","9:00 AM - 2:00 PM","Friday","+880 1700-000001"],
    ["doctor-002","Dr. Rafi Ahmed","Internal Medicine","Dhanmondi Medical Centre","Dhanmondi 8/A, Dhaka",23.7448,90.3711,"MBBS, MD","8 years","4:00 PM - 8:00 PM","Tuesday","+880 1700-000002"],
    ["doctor-003","Dr. Nabila Khan","Dermatology","Green Road Chamber","Green Road, Dhaka",23.7412,90.3885,"MBBS, DDV","10 years","5:00 PM - 9:00 PM","Sunday","+880 1700-000003"],
    ["doctor-004","Dr. Samiul Haque","Neurology","Uttara Health Hospital","Sector 7, Uttara",23.8724,90.3791,"MBBS, FCPS","14 years","6:00 PM - 9:00 PM","Wednesday","+880 1700-000004"],
    ["doctor-005","Dr. Tania Rahman","Paediatrics","Mirpur Family Hospital","Mirpur 10, Dhaka",23.8066,90.3686,"MBBS, DCH","7 years","10:00 AM - 1:00 PM","Thursday","+880 1700-000005"],
    ["doctor-006","Dr. Imran Chowdhury","Orthopaedics","Mohammadpur Ortho Care","Mohammadpur, Dhaka",23.7639,90.3581,"MBBS, MS","11 years","3:00 PM - 7:00 PM","Saturday","+880 1700-000006"],
    ["doctor-007","Dr. Farzana Islam","Gynaecology","Gulshan Women’s Clinic","Gulshan 2, Dhaka",23.7936,90.4145,"MBBS, FCPS","13 years","4:00 PM - 8:00 PM","Monday","+880 1700-000007"],
    ["doctor-008","Dr. Mahin Kabir","ENT Specialist","Badda Specialist Centre","Badda, Dhaka",23.7804,90.4261,"MBBS, DLO","6 years","5:00 PM - 9:00 PM","Friday","+880 1700-000008"],
    ["doctor-009","Dr. Sadia Noor","Endocrinology","Farmgate Health Point","Farmgate, Dhaka",23.7578,90.3896,"MBBS, MD","9 years","2:00 PM - 6:00 PM","Tuesday","+880 1700-000009"],
    ["doctor-010","Dr. Arman Hossain","General Physician","Banani Care Chamber","Banani, Dhaka",23.7937,90.4041,"MBBS","5 years","6:00 PM - 9:00 PM","Thursday","+880 1700-000010"]
  ].map(providerFromRow);
  const clinicsData = [
    ["clinic-001","Dhanmondi Family Clinic","Road 5, Dhanmondi, Dhaka",23.7468,90.3748,"+880 1800-000101","demo.clinic01@example.invalid","8:00 AM - 10:00 PM","Family medicine, vaccination"],
    ["clinic-002","Green Road Wellness Clinic","Green Road, Dhaka",23.7418,90.3882,"+880 1800-000102","demo.clinic02@example.invalid","9:00 AM - 9:00 PM","Primary care, physiotherapy"],
    ["clinic-003","Mirpur Community Clinic","Mirpur 1, Dhaka",23.8041,90.3658,"+880 1800-000103","demo.clinic03@example.invalid","8:00 AM - 8:00 PM","Family medicine, diagnostics"],
    ["clinic-004","Uttara Wellness Point","Sector 4, Uttara",23.8682,90.3856,"+880 1800-000104","demo.clinic04@example.invalid","10:00 AM - 10:00 PM","Dental care, general practice"],
    ["clinic-005","Gulshan Health Studio","Gulshan 1, Dhaka",23.7807,90.4147,"+880 1800-000105","demo.clinic05@example.invalid","8:00 AM - 9:00 PM","Women’s health, nutrition"],
    ["clinic-006","Mohammadpur Care Clinic","Town Hall, Mohammadpur",23.7587,90.3589,"+880 1800-000106","demo.clinic06@example.invalid","9:00 AM - 8:00 PM","Paediatrics, primary care"],
    ["clinic-007","Badda Neighbourhood Clinic","Badda, Dhaka",23.7809,90.4264,"+880 1800-000107","demo.clinic07@example.invalid","8:00 AM - 8:00 PM","General practice, lab collection"],
    ["clinic-008","Banani Family Care","Banani, Dhaka",23.7931,90.4047,"+880 1800-000108","demo.clinic08@example.invalid","10:00 AM - 10:00 PM","General practice, pharmacy"]
  ].map(providerFromRow);
  const hospitalsData = [
    ["hospital-kuet-medical-center","KUET Campus Medical Center","Central Campus Avenue, KUET, Khulna 9203",22.9015,89.5032,"+880-41-769468","map.facility@example.invalid","24/7 Open","Campus emergency and primary care","Emergency available"],
    ["hospital-kmch","Khulna Medical College Hospital (KMCH)","Boyra Main Road, Khulna 9000",22.8436,89.5412,"+880-41-760350","map.facility@example.invalid","24/7 Open","ICU: 24 beds, trauma emergency","Emergency available"],
    ["hospital-abu-naser","Shaheed Sheikh Abu Naser Hospital","Mujgunni Main Road, Khulna 9000",22.8552,89.5310,"+880-41-761509","map.facility@example.invalid","24/7 Open","Cardiology and ICU: 15 beds","Emergency available"],
    ["hospital-gazi-medical","Gazi Medical College Hospital","Sonadanga Main Road, Khulna 9100",22.8390,89.5350,"+880-41-761509","map.facility@example.invalid","24/7 Open","General emergency and ICU: 18 beds","Emergency available"]
  ].map(providerFromRow);
  const pharmaciesData = [
    ["pharmacy-citycare","CityCare 24/7 Pharmacy","Fulbarigate Commercial Point, Khulna",22.8988,89.5058,"+880-1711-223344","map.facility@example.invalid","24/7 Open","Prescriptions and emergency oxygen","24-hour availability"],
    ["pharmacy-alshefa","Al-Shefa Pharmacy","Teligati Main Gate, KUET, Khulna",22.9042,89.4990,"+880-1912-345678","map.facility@example.invalid","Open now","Prescriptions and vital medicines","Open now"]
  ].map(providerFromRow);
  const providerDatasets = { doctors: doctorsData, clinics: clinicsData, hospitals: hospitalsData, pharmacies: pharmaciesData };
  const providerMeta = {
    doctors: ["Doctors", "Search doctors by name or specialization...", "⚕"],
    clinics: ["Clinics", "Search clinics by name or location...", "⌂"],
    hospitals: ["Hospitals", "Search hospitals by name or location...", "✚"],
    pharmacies: ["Pharmacies", "Search pharmacies by name or location...", "⚕"]
  };
  let selectedProviderCategory = "doctors";
  let selectedProviderLocation = demoLocations.kuet;
  let providerFocusTarget = null;

  function toRecord(row) { return { icon: row[0], title: row[1], specialty: row[2], date: row[3], facility: row[4], status: row[5], time: row[6], body: row[7] || row[5] }; }
  function loadProfile() { try { return Object.assign({}, fallback, JSON.parse(localStorage.getItem("sasthoProfile") || "{}")); } catch (error) { return Object.assign({}, fallback); } }
  function saveProfile() { localStorage.setItem("sasthoProfile", JSON.stringify(profile)); }
  function esc(value) { return String(value || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])); }
  function age(value) { const birth = new Date(value); const now = new Date(); let years = now.getFullYear() - birth.getFullYear(); if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) years--; return Math.max(0, years); }
  function longDate(value) { return new Date(value + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); }
  function avatar(value) { return value || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e4f4f1'/%3E%3Ccircle cx='50' cy='38' r='19' fill='%23087f81'/%3E%3Cpath d='M18 94c4-25 19-35 32-35s28 10 32 35' fill='%23087f81'/%3E%3C/svg%3E"; }
  function updateProfile() {
    document.getElementById("profileImage").src = avatar(profile.avatar);
    ["profileName", "headerName"].forEach(id => document.getElementById(id).textContent = profile.name);
    document.getElementById("profileDob").textContent = longDate(profile.dob);
    document.getElementById("profileAge").textContent = age(profile.dob) + " years";
    document.getElementById("profilePhone").textContent = profile.phone;
    document.getElementById("profileEmail").textContent = profile.email;
    document.getElementById("profileLocation").textContent = profile.location;
  }
  function modal(title, content) {
    document.getElementById("modalRoot").innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-header"><h2>${title}</h2><button class="modal-close" data-close aria-label="Close">×</button></div><div class="modal-body">${content}</div></div></div>`;
  }
  function detailList(items) { return `<dl class="detail-list">${items.map(item => `<div><dt>${item[0]}</dt><dd>${esc(item[1])}</dd></div>`).join("")}</dl>`; }
  function recordDetails(data, kind) {
    const items = kind === "report" ? [["Report date", data.date], ["Facility", data.facility]] : kind === "prescription" ? [["Doctor", data.title], ["Specialization", data.specialty], ["Date", data.date], ["Hospital / clinic", data.facility]] : [["Doctor", data.title], ["Specialization", data.specialty], ["Date and time", data.date + " · " + data.time], ["Hospital / clinic", data.facility], ["Status", data.status]];
    return `<div class="modal-section"><h3>${kind === "report" ? "Report information" : kind === "prescription" ? "Doctor and prescription" : "Appointment information"}</h3>${detailList(items)}</div><div class="modal-section"><h3>${kind === "report" ? "Findings" : kind === "prescription" ? "Prescription details" : "Visit details"}</h3><p>${esc(data.body).replace(/\n/g, "<br>")}<br><br><em>Demonstration data</em></p></div>`;
  }
  function renderRecords(tab) {
    const list = tab === "reports" ? reports : tab === "prescriptions" ? prescriptions : visits;
    const kind = tab === "reports" ? "report" : tab === "prescriptions" ? "prescription" : "visit";
    document.getElementById("recordsContent").innerHTML = list.map((item, index) => `<article class="record-card"><div class="card-icon">${item.icon}</div><h3 class="card-title">${item.title}</h3>${item.specialty ? `<p class="card-meta">${item.specialty}</p>` : ""}<p class="card-meta">${item.date}${item.time ? " · " + item.time : ""}</p><p class="card-meta">${item.facility}</p><div class="card-footer">${item.status ? `<span class="badge ${item.status === "Completed" ? "" : "blue"}">${item.status}</span>` : "<span class=\"badge\">Demo record</span>"}<button class="text-button" data-record="${kind}:${index}">Show details →</button></div></article>`).join("");
  }
  function profileDetails() {
    const personal = [["Full name", profile.name], ["Date of birth", longDate(profile.dob)], ["Age", age(profile.dob) + " years"], ["Blood group", profile.blood], ["Hometown", profile.hometown], ["Profession", profile.profession], ["Religion", profile.religion], ["NID / Birth certificate", "••••••••" + profile.nid.slice(-4)], ["Current address", profile.address]];
    const contact = [["Email address", profile.email], ["Phone number", profile.phone], ["WhatsApp number", profile.whatsapp]];
    return `<div class="modal-section"><h3>Personal details</h3>${detailList(personal)}</div><div class="modal-section"><h3>Contact details</h3>${detailList(contact)}</div>`;
  }
  function editForm() {
    const fields = [["name", "Full name", "text", true], ["dob", "Date of birth", "date", true], ["blood", "Blood group", "text"], ["hometown", "Hometown", "text"], ["profession", "Profession", "text"], ["religion", "Religion", "text"], ["nid", "NID / Birth certificate", "text"], ["email", "Email address", "email", true], ["phone", "Phone number", "tel", true], ["whatsapp", "WhatsApp number", "tel"], ["address", "Current address", "text"]];
    return `<form id="profileForm"><div class="form-grid">${fields.map(f => `<div class="field ${f[0] === "address" ? "full" : ""}"><label for="field-${f[0]}">${f[1]}</label><input id="field-${f[0]}" name="${f[0]}" type="${f[2]}" value="${esc(profile[f[0]])}" ${f[3] ? "required" : ""}></div>`).join("")}</div><div class="file-preview"><img src="${avatar(profile.avatar)}" alt=""><span>Profile picture</span><button type="button" class="danger" id="removeAvatar">Remove picture</button></div><div class="form-actions"><button type="button" class="button button-secondary" data-close>Cancel</button><button class="button button-primary">Save changes</button></div></form>`;
  }
  function providerFromRow(row) {
    const categoryName = row[0].split("-")[0];
    const provider = { id: row[0], category: categoryName, name: row[1], address: row[2], latitude: row[3], longitude: row[4], phone: row[5], email: row[6], hours: row[7], services: row[8], emergency: row[9] };
    if (categoryName === "doctor") Object.assign(provider, { specialty: row[2], hospital: row[3], address: row[4], latitude: row[5], longitude: row[6], qualifications: row[7], experience: row[8], hours: row[9], offDays: row[10], phone: row[11] });
    return provider;
  }
  // Replace this mock repository with category-specific API calls when the backend is available.
  function getProvidersByCategory(providerCategory) { return Promise.resolve(providerDatasets[providerCategory] || []); }
  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (![lat1, lon1, lat2, lon2].every(value => Number.isFinite(Number(value)))) return null;
    const radians = value => value * Math.PI / 180;
    const latitudeDelta = radians(lat2 - lat1);
    const longitudeDelta = radians(lon2 - lon1);
    const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(longitudeDelta / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function sortProvidersByDistance(items, location) {
    return items.map(provider => Object.assign({}, provider, { distance: calculateDistance(location.latitude, location.longitude, provider.latitude, provider.longitude) })).sort((a, b) => (a.distance === null ? 1 : b.distance === null ? -1 : a.distance - b.distance));
  }
  function searchProviders(query, providerCategory) {
    const normalized = query.trim().toLowerCase();
    return getProvidersByCategory(providerCategory).then(items => items.filter(provider => {
      if (!normalized) return true;
      const searchable = providerCategory === "doctors" ? [provider.name, provider.specialty, provider.hospital, provider.address] : providerCategory === "clinics" ? [provider.name, provider.address, provider.services] : providerCategory === "hospitals" ? [provider.name, provider.address, provider.services] : [provider.name, provider.address];
      return searchable.join(" ").toLowerCase().includes(normalized);
    })).then(items => sortProvidersByDistance(items, selectedProviderLocation));
  }
  function contactUrl(phone, scheme) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits || digits.length < 7) return "";
    return scheme === "whatsapp" ? "https://wa.me/" + (digits.startsWith("0") ? "880" + digits.slice(1) : digits) + "?text=" + encodeURIComponent("Hello, I am enquiring about your healthcare services.") : "tel:" + (phone || "");
  }
  function providerDetails(provider) {
    const rows = [["Full address", provider.address], ["Contact phone", provider.phone], ["Contact email", provider.email], ["Opening hours", provider.hours]];
    if (selectedProviderCategory === "doctors") rows.push(["Qualifications", provider.qualifications], ["Experience", provider.experience], ["Off-days", provider.offDays], ["Consultation hours", provider.hours], ["Chamber / hospital", provider.hospital]);
    else if (selectedProviderCategory === "clinics") rows.push(["Available services", provider.services]);
    else if (selectedProviderCategory === "hospitals") rows.push(["Departments", provider.services], ["Emergency", provider.emergency || "Not specified"]);
    else rows.push(["24-hour availability", provider.services]);
    rows.push(["Distance", provider.distance === null ? "Distance unavailable" : provider.distance.toFixed(1) + " km away"]);
    return rows.map(row => `<div class="provider-detail"><dt>${row[0]}</dt><dd>${esc(row[1])}</dd></div>`).join("");
  }
  function renderProviderCard(provider, index) {
    const type = selectedProviderCategory.slice(0, -1);
    const icon = providerMeta[selectedProviderCategory][2];
    const distance = provider.distance === null ? "Distance unavailable" : provider.distance.toFixed(1) + " km away";
    const isDoctor = selectedProviderCategory === "doctors";
    const whatsapp = contactUrl(provider.phone, "whatsapp");
    const call = contactUrl(provider.phone, "call");
    const contacts = isDoctor ? `<button class="provider-action provider-action-primary" data-provider-profile="${index}">View Doctor Profile</button><button class="provider-action" data-book-provider="${index}">Book an Appointment</button>` : `<a class="provider-action ${whatsapp ? "" : "provider-no-contact"}" ${whatsapp ? `href="${whatsapp}" target="_blank" rel="noopener"` : 'aria-disabled="true"'}>WhatsApp</a><a class="provider-action ${call ? "" : "provider-no-contact"}" ${call ? `href="${call}"` : 'aria-disabled="true"'}>Call Now</a>`;
    return `<article class="provider-result-card"><div class="provider-card-main"><div class="provider-card-icon">${icon}</div><div class="provider-card-info"><h3>${esc(provider.name)}</h3><p>${esc(isDoctor ? provider.specialty : provider.address)}</p><p>${esc(isDoctor ? provider.hospital : provider.phone)} · <span>${esc(provider.email)}</span></p></div><span class="provider-distance">${distance}</span></div><div class="provider-card-actions">${contacts}</div><button class="provider-expand" data-provider-expand="${index}" aria-expanded="false">Show Details</button><dl class="provider-details" id="provider-details-${index}">${providerDetails(provider)}</dl>${!isDoctor && !whatsapp ? '<p class="provider-contact-note">Contact links are unavailable for this demonstration record.</p>' : ""}</article>`;
  }
  function renderProviderResults(items) {
    const results = document.getElementById("providerResults");
    if (!items.length) { results.innerHTML = '<div class="provider-empty">No results found. Try a different search term.</div>'; return; }
    results.innerHTML = items.map(renderProviderCard).join("");
  }
  function renderProviderSearch() {
    const meta = providerMeta[selectedProviderCategory];
    document.getElementById("providerSearchTitle").textContent = "Find " + meta[0];
    document.getElementById("providerSearch").placeholder = meta[1];
    searchProviders(document.getElementById("providerSearch").value, selectedProviderCategory).then(renderProviderResults).catch(() => { document.getElementById("providerResults").innerHTML = '<div class="provider-error">The provider directory could not be loaded. Please try again.</div>'; });
  }
  function showWorkInProgressModal(type, providerName) {
    const title = type === "doctor" ? "Doctor Profile – Work in Progress" : "Appointment Booking – Work in Progress";
    const message = type === "doctor" ? "The complete doctor profile page for " + esc(providerName) + " will be available in a future version." : "Appointment booking for " + esc(providerName) + " will be available in a future version.";
    providerFocusTarget = document.activeElement;
    modal(title, `<div class="empty"><p>${message}</p><button class="button button-primary" data-close>Close</button></div>`);
  }
  document.addEventListener("click", event => {
    if (event.target.closest("[data-close]") || event.target.classList.contains("modal-backdrop")) document.getElementById("modalRoot").innerHTML = "";
    const moduleButton = event.target.closest("[data-module]");
    if (moduleButton) {
      const moduleName = moduleButton.dataset.module;
      document.querySelectorAll("[data-module]").forEach(button => {
        const selected = button === moduleButton;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-selected", String(selected));
      });
      document.querySelectorAll("[data-module-view]").forEach(view => view.classList.toggle("active", view.dataset.moduleView === moduleName));
      if (moduleName === "healthcare") renderProviderSearch();
    }
    const tab = event.target.closest("[data-tab]");
    if (tab) { document.querySelectorAll(".tab").forEach(button => button.classList.remove("active")); tab.classList.add("active"); renderRecords(tab.dataset.tab); }
    const record = event.target.closest("[data-record]");
    if (record) { const [kind, index] = record.dataset.record.split(":"); const list = kind === "report" ? reports : kind === "prescription" ? prescriptions : visits; modal(list[index].title, recordDetails(list[index], kind)); }
    const categoryButton = event.target.closest("[data-provider-category]");
    if (categoryButton) {
      selectedProviderCategory = categoryButton.dataset.providerCategory;
      document.querySelectorAll("[data-provider-category]").forEach(button => { button.classList.toggle("active", button === categoryButton); button.setAttribute("aria-pressed", button === categoryButton ? "true" : "false"); });
      document.getElementById("providerSearch").value = "";
      renderProviderSearch();
    }
    const expand = event.target.closest("[data-provider-expand]");
    if (expand) { const details = document.getElementById("provider-details-" + expand.dataset.providerExpand); const open = expand.getAttribute("aria-expanded") === "true"; expand.setAttribute("aria-expanded", String(!open)); expand.textContent = open ? "Show Details" : "Hide Details"; details.classList.toggle("open", !open); }
    const doctorProfile = event.target.closest("[data-provider-profile]");
    if (doctorProfile) searchProviders(document.getElementById("providerSearch").value, selectedProviderCategory).then(items => showWorkInProgressModal("doctor", items[doctorProfile.dataset.providerProfile].name));
    const bookProvider = event.target.closest("[data-book-provider]");
    if (bookProvider) searchProviders(document.getElementById("providerSearch").value, selectedProviderCategory).then(items => showWorkInProgressModal("appointment", items[bookProvider.dataset.bookProvider].name));
    if (event.target.id === "showProfile") modal("Personal profile", profileDetails());
    if (event.target.id === "editProfile") { modal("Edit profile", editForm()); document.getElementById("profileForm").addEventListener("submit", saveForm); document.getElementById("removeAvatar").addEventListener("click", () => { profile.avatar = ""; saveProfile(); modal("Edit profile", editForm()); document.getElementById("profileForm").addEventListener("submit", saveForm); }); }
    if (event.target.id === "bookAppointment") modal("Appointment booking", '<div class="empty"><div class="card-icon" style="margin:0 auto 15px">◷</div><h3>Appointment Booking – Work in Progress</h3><p>Online appointment booking will be available soon.</p></div>');
    if (event.target.id === "bookAppointmentModule" || event.target.closest("[data-booking-action]")) modal("Appointment booking", '<div class="empty"><div class="card-icon" style="margin:0 auto 15px">◷</div><h3>Appointment Booking – Work in Progress</h3><p>Online appointment booking will be available soon.</p></div>');
    if (event.target.id === "clearSearch") { document.getElementById("providerSearch").value = ""; renderProviderSearch(); }
  });
  function saveForm(event) { event.preventDefault(); profile = Object.assign({}, profile, Object.fromEntries(new FormData(event.target).entries())); saveProfile(); updateProfile(); document.getElementById("modalRoot").innerHTML = ""; }
  document.getElementById("providerSearchForm").addEventListener("submit", event => { event.preventDefault(); renderProviderSearch(); });
  document.getElementById("providerLocation").addEventListener("change", event => { selectedProviderLocation = demoLocations[event.target.value] || demoLocations.kuet; renderProviderSearch(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && document.querySelector(".modal-backdrop")) { document.getElementById("modalRoot").innerHTML = ""; if (providerFocusTarget) providerFocusTarget.focus(); providerFocusTarget = null; } });
  document.getElementById("avatarInput").addEventListener("change", event => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { profile.avatar = reader.result; saveProfile(); updateProfile(); }; reader.readAsDataURL(file); });
  updateProfile(); renderRecords("reports"); renderProviderSearch();
}());
