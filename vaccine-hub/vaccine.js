
// ========================================
// SHASTHO SHOHOJ - VACCINE HUB
// ========================================

const vaccineData = [
  {
    id: "BCG",
    name: "BCG",
    bn: "বিসিজি",
    description: "BCG is a vaccine used to help protect children against severe forms of tuberculosis."
  },
  {
    id: "Pentavalent",
    name: "Pentavalent Vaccine",
    bn: "পেন্টাভ্যালেন্ট টিকা",
    description: "A combination vaccine used in childhood immunization programmes to protect against several diseases."
  },
  {
    id: "OPV",
    name: "Oral Polio Vaccine (OPV)",
    bn: "ওরাল পোলিও টিকা",
    description: "OPV is an oral vaccine used to protect against poliovirus."
  },
  {
    id: "IPV",
    name: "Inactivated Polio Vaccine (IPV)",
    bn: "ইনঅ্যাক্টিভেটেড পোলিও টিকা",
    description: "IPV is an injectable vaccine used to protect against poliovirus."
  },
  {
    id: "PCV",
    name: "Pneumococcal Conjugate Vaccine",
    bn: "নিউমোকক্কাল কনজুগেট টিকা",
    description: "PCV helps protect against diseases caused by pneumococcal bacteria."
  },
  {
    id: "MR",
    name: "Measles-Rubella Vaccine",
    bn: "হাম-রুবেলা টিকা",
    description: "The MR vaccine helps protect against measles and rubella."
  },
  {
    id: "HPV",
    name: "Human Papillomavirus Vaccine",
    bn: "হিউম্যান প্যাপিলোমাভাইরাস টিকা",
    description: "The HPV vaccine helps prevent infection from HPV types associated with certain cancers."
  },
  {
    id: "COVID-19",
    name: "COVID-19 Vaccine",
    bn: "কোভিড-১৯ টিকা",
    description: "COVID-19 vaccines help reduce the risk of severe illness caused by COVID-19."
  }
];

const STORAGE_KEY = "shasthoShohojVaccineEntries";

let currentLanguage = "en";
let selectedVaccine = "BCG";
let currentFilter = "all";
let vaccineEntries = [];

// Load saved entries safely
try {
  const savedEntries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  vaccineEntries = Array.isArray(savedEntries) ? savedEntries : [];
} catch (error) {
  vaccineEntries = [];
}

// ========================================
// PAGE NAVIGATION
// ========================================

function showPage(pageId) {
  document.querySelectorAll(".vh-page").forEach(page => {
    page.classList.remove("active");
  });

  const targetPage = document.getElementById(pageId);

  if (!targetPage) return;

  targetPage.classList.add("active");

  document.querySelectorAll(".vh-nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".vh-nav-btn").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.go);
  });
});

// ========================================
// LANGUAGE SWITCHING
// ========================================

function setLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-en][data-bn]").forEach(element => {
    element.textContent =
      language === "bn" ? element.dataset.bn : element.dataset.en;
  });

  document.getElementById("language-en").classList.toggle("active", language === "en");
  document.getElementById("language-bn").classList.toggle("active", language === "bn");

  document.getElementById("vaccine-search").placeholder =
    language === "bn" ? "টিকা খুঁজুন..." : "Search vaccines...";

  renderVaccineList();
  renderVaccineDetail();
  populateVaccineSelect();
  renderSchedule();
  renderRecords();
}

document.getElementById("language-en").addEventListener("click", () => {
  setLanguage("en");
});

document.getElementById("language-bn").addEventListener("click", () => {
  setLanguage("bn");
});

// ========================================
// VACCINE INFORMATION
// ========================================

function getVaccineName(id) {
  const vaccine = vaccineData.find(item => item.id === id);

  if (!vaccine) return id;

  return currentLanguage === "bn" ? vaccine.bn : vaccine.name;
}

function renderVaccineList() {
  const list = document.getElementById("vaccine-list");
  const search = document.getElementById("vaccine-search").value.toLowerCase();

  list.innerHTML = "";

  const filteredVaccines = vaccineData.filter(vaccine => {
    return (
      vaccine.name.toLowerCase().includes(search) ||
      vaccine.id.toLowerCase().includes(search) ||
      vaccine.bn.includes(search)
    );
  });

  filteredVaccines.forEach(vaccine => {
    const button = document.createElement("button");

    button.className = "vh-vaccine-item";
    button.classList.toggle("active", selectedVaccine === vaccine.id);
    button.textContent = getVaccineName(vaccine.id);

    button.addEventListener("click", () => {
      selectedVaccine = vaccine.id;
      renderVaccineList();
      renderVaccineDetail();
    });

    list.appendChild(button);
  });

  if (filteredVaccines.length === 0) {
    const message = document.createElement("p");
    message.className = "vh-empty";
    message.textContent = currentLanguage === "bn"
      ? "কোনো টিকা পাওয়া যায়নি।"
      : "No vaccines found.";

    list.appendChild(message);
  }
}

function renderVaccineDetail() {
  const vaccine = vaccineData.find(item => item.id === selectedVaccine);
  const detail = document.getElementById("vaccine-detail");

  detail.innerHTML = "";

  if (!vaccine) return;

  const icon = document.createElement("div");
  icon.className = "vh-empty-icon";
  icon.textContent = "💉";

  const title = document.createElement("h2");
  title.textContent = getVaccineName(vaccine.id);

  const description = document.createElement("p");
  description.textContent = vaccine.description;

  const label = document.createElement("p");
  label.textContent = currentLanguage === "bn"
    ? "সাধারণ তথ্য"
    : "General information";

  detail.append(icon, title, label, description);
}

document.getElementById("vaccine-search").addEventListener("input", renderVaccineList);

// ========================================
// SCHEDULE - ADD AND SAVE ENTRIES
// ========================================

function saveEntries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vaccineEntries));
  } catch (error) {
    alert("Could not save your entries in this browser.");
  }

  renderSchedule();
  renderRecords();
}

function populateVaccineSelect() {
  const select = document.getElementById("entry-vaccine");
  const previousValue = select.value;

  select.innerHTML = "";

  vaccineData.forEach(vaccine => {
    const option = document.createElement("option");
    option.value = vaccine.id;
    option.textContent = getVaccineName(vaccine.id);
    select.appendChild(option);
  });

  if (vaccineData.some(vaccine => vaccine.id === previousValue)) {
    select.value = previousValue;
  }
}

function openEntryModal() {
  populateVaccineSelect();

  document.getElementById("entry-modal").classList.add("show");
  document.getElementById("entry-modal").setAttribute("aria-hidden", "false");
}

function closeEntryModal() {
  document.getElementById("entry-modal").classList.remove("show");
  document.getElementById("entry-modal").setAttribute("aria-hidden", "true");
  document.getElementById("entry-form").reset();
}

document.getElementById("add-entry-btn").addEventListener("click", openEntryModal);
document.getElementById("close-modal").addEventListener("click", closeEntryModal);
document.getElementById("cancel-entry").addEventListener("click", closeEntryModal);

document.getElementById("entry-modal").addEventListener("click", event => {
  if (event.target.id === "entry-modal") {
    closeEntryModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeEntryModal();
});

document.getElementById("entry-form").addEventListener("submit", event => {
  event.preventDefault();

  const entry = {
    id: Date.now().toString(),
    vaccine: document.getElementById("entry-vaccine").value,
    note: document.getElementById("entry-note").value.trim(),
    date: document.getElementById("entry-date").value,
    status: document.getElementById("entry-status").value
  };

  if (!entry.note || !entry.date) {
    alert("Please complete all fields.");
    return;
  }

  vaccineEntries.push(entry);
  saveEntries();
  closeEntryModal();
});

// ========================================
// SCHEDULE - FILTER AND DISPLAY
// ========================================

function renderSchedule() {
  const tbody = document.getElementById("schedule-body");
  const emptyMessage = document.getElementById("schedule-empty");

  tbody.innerHTML = "";

  const filteredEntries = vaccineEntries
    .filter(entry => currentFilter === "all" || entry.status === currentFilter)
    .sort((a, b) => a.date.localeCompare(b.date));

  filteredEntries.forEach(entry => {
    const row = document.createElement("tr");

    const vaccineCell = document.createElement("td");
    vaccineCell.textContent = getVaccineName(entry.vaccine);

    const noteCell = document.createElement("td");
    noteCell.textContent = entry.note;

    const dateCell = document.createElement("td");
    dateCell.textContent = entry.date;

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    status.className = "vh-status";

    if (entry.status === "completed") {
      status.classList.add("completed");
    }

    status.textContent = entry.status === "completed" ? "Completed" : "Upcoming";
    statusCell.appendChild(status);

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");

    deleteButton.className = "vh-delete";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      if (confirm("Delete this entry?")) {
        vaccineEntries = vaccineEntries.filter(item => item.id !== entry.id);
        saveEntries();
      }
    });

    actionCell.appendChild(deleteButton);
    row.append(vaccineCell, noteCell, dateCell, statusCell, actionCell);
    tbody.appendChild(row);
  });

  emptyMessage.hidden = filteredEntries.length > 0;
}

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll("[data-filter]").forEach(filterButton => {
      filterButton.classList.toggle("active", filterButton === button);
    });

    renderSchedule();
  });
});

// ========================================
// COMPLETED VACCINE RECORDS
// ========================================

function renderRecords() {
  const tbody = document.getElementById("records-body");
  const emptyMessage = document.getElementById("records-empty");

  tbody.innerHTML = "";

  const completedEntries = vaccineEntries
    .filter(entry => entry.status === "completed")
    .sort((a, b) => a.date.localeCompare(b.date));

  completedEntries.forEach(entry => {
    const row = document.createElement("tr");

    const vaccineCell = document.createElement("td");
    vaccineCell.textContent = getVaccineName(entry.vaccine);

    const noteCell = document.createElement("td");
    noteCell.textContent = entry.note;

    const dateCell = document.createElement("td");
    dateCell.textContent = entry.date;

    const statusCell = document.createElement("td");
    const status = document.createElement("span");

    status.className = "vh-status completed";
    status.textContent = "Completed";

    statusCell.appendChild(status);
    row.append(vaccineCell, noteCell, dateCell, statusCell);
    tbody.appendChild(row);
  });

  emptyMessage.hidden = completedEntries.length > 0;
}

document.getElementById("print-records").addEventListener("click", () => {
  showPage("records");
  window.print();
});

// ========================================
// INITIALIZE MODULE
// ========================================

populateVaccineSelect();
renderVaccineList();
renderVaccineDetail();
renderSchedule();
renderRecords();
