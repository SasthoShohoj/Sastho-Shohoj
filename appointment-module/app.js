// Default initial seed data conforming to Shastho Shohoj specifications
const INITIAL_APPOINTMENTS = [
  {
    id: "APT-1001",
    doctor: "Dr. Ayesha Rahman",
    specialty: "Cardiology",
    facility: "Khulna City Medical Hospital",
    scheduledAt: "2026-11-15T10:30",
    status: "Confirmed", // Confirmed
    fee: "৳ 1,200"
  },
  {
    id: "APT-1002",
    doctor: "Dr. Tanvir Hasan",
    specialty: "General Medicine",
    facility: "Comfort Diagnostic Chamber",
    scheduledAt: "2026-11-18T16:00",
    status: "Pending Review", // Appointment Request
    fee: "৳ 800"
  }
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, text: "Your request with Dr. Ayesha Rahman was Confirmed by the clinic.", time: "2 hours ago" },
  { id: 2, text: "Request APT-1002 is under review by Comfort Diagnostic Chamber.", time: "1 day ago" }
];

// State Access
let appointments = JSON.parse(localStorage.getItem("ss_appointments")) || INITIAL_APPOINTMENTS;
let notifications = JSON.parse(localStorage.getItem("ss_notifications")) || INITIAL_NOTIFICATIONS;
let activeFilter = "ALL";
let activeModalAction = null; // 'RESCHEDULE' | 'CANCEL'
let targetAppointmentId = null;

// DOM References
const appointmentsContainer = document.getElementById("appointments-container");
const notifBell = document.getElementById("notif-bell");
const notifTray = document.getElementById("notification-tray");
const notifList = document.getElementById("notification-list");
const unreadCount = document.getElementById("unread-count");
const clearNotifsBtn = document.getElementById("clear-notifs-btn");

// Modal Elements
const modal = document.getElementById("action-modal");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");
const rescheduleFields = document.getElementById("reschedule-fields");
const newDatetimeInput = document.getElementById("new-datetime");
const actionReasonInput = document.getElementById("action-reason");
const cancelModalBtn = document.getElementById("cancel-modal-btn");
const submitModalBtn = document.getElementById("submit-modal-btn");

function saveState() {
  localStorage.setItem("ss_appointments", JSON.stringify(appointments));
  localStorage.setItem("ss_notifications", JSON.stringify(notifications));
}

function getBadgeClass(status) {
  switch (status) {
    case "Confirmed": return "confirmed";
    case "Pending Review": return "pending";
    case "Reschedule Requested": return "reschedule-requested";
    case "Cancelled": return "cancelled";
    default: return "pending";
  }
}

// 1. Render Appointments
function renderAppointments() {
  appointmentsContainer.innerHTML = "";

  const filtered = appointments.filter(apt => {
    if (activeFilter === "REQUESTS") return apt.status === "Pending Review" || apt.status === "Reschedule Requested";
    if (activeFilter === "CONFIRMED") return apt.status === "Confirmed";
    return true;
  });

  if (filtered.length === 0) {
    appointmentsContainer.innerHTML = `<p style="color: #888; text-align: center; margin-top: 24px;">No appointments found in this view.</p>`;
    return;
  }

  filtered.forEach(apt => {
    const card = document.createElement("article");
    card.className = "appointment-card";
    const formattedDate = new Date(apt.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

    const isActionable = apt.status !== "Cancelled";

    card.innerHTML = `
      <div class="card-top">
        <div>
          <h3 class="doctor-name">${apt.doctor}</h3>
          <p class="specialty">${apt.specialty} &bull; ${apt.facility}</p>
        </div>
        <span class="badge ${getBadgeClass(apt.status)}">${apt.status}</span>
      </div>
      <div class="card-details">
        <div><strong>Time:</strong> ${formattedDate}</div>
        <div><strong>Fee:</strong> ${apt.fee}</div>
        <div><strong>Booking ID:</strong> ${apt.id}</div>
      </div>
      ${isActionable ? `
        <div class="card-actions">
          <button class="btn btn-secondary" onclick="openModal('RESCHEDULE', '${apt.id}')">Request Reschedule</button>
          <button class="btn btn-danger" onclick="openModal('CANCEL', '${apt.id}')">Request Cancellation</button>
        </div>
      ` : ""}
    `;
    appointmentsContainer.appendChild(card);
  });
}

// 2. Render Notifications
function renderNotifications() {
  unreadCount.innerText = notifications.length;
  notifList.innerHTML = "";

  if (notifications.length === 0) {
    notifList.innerHTML = `<li style="color: #999;">No new notifications</li>`;
    return;
  }

  notifications.forEach(n => {
    const li = document.createElement("li");
    li.innerHTML = `<div>${n.text}</div><small style="color: #888;">${n.time}</small>`;
    notifList.appendChild(li);
  });
}

// 3. Modal Actions (Reschedule / Cancellation)
window.openModal = function(actionType, aptId) {
  activeModalAction = actionType;
  targetAppointmentId = aptId;
  actionReasonInput.value = "";
  newDatetimeInput.value = "";

  const apt = appointments.find(a => a.id === aptId);

  if (actionType === "RESCHEDULE") {
    modalTitle.innerText = "Request Reschedule";
    modalDesc.innerText = `Submit a preferred alternative time for appointment with ${apt.doctor}.`;
    rescheduleFields.classList.remove("hidden");
  } else {
    modalTitle.innerText = "Request Cancellation";
    modalDesc.innerText = `Are you sure you want to cancel the booking with ${apt.doctor}?`;
    rescheduleFields.classList.add("hidden");
  }

  modal.classList.remove("hidden");
};

function closeModal() {
  modal.classList.add("hidden");
  activeModalAction = null;
  targetAppointmentId = null;
}

submitModalBtn.addEventListener("click", () => {
  const apt = appointments.find(a => a.id === targetAppointmentId);
  if (!apt) return;

  if (activeModalAction === "RESCHEDULE") {
    const newDate = newDatetimeInput.value;
    if (!newDate) {
      alert("Please select a preferred date and time.");
      return;
    }
    apt.scheduledAt = newDate;
    apt.status = "Reschedule Requested";

    // Push status notification
    notifications.unshift({
      id: Date.now(),
      text: `Reschedule requested for ${apt.doctor} (${apt.id}). Pending admin review.`,
      time: "Just now"
    });
  } else if (activeModalAction === "CANCEL") {
    apt.status = "Cancelled";

    // Push status notification
    notifications.unshift({
      id: Date.now(),
      text: `Appointment with ${apt.doctor} (${apt.id}) has been cancelled.`,
      time: "Just now"
    });
  }

  saveState();
  renderAppointments();
  renderNotifications();
  closeModal();
});

cancelModalBtn.addEventListener("click", closeModal);

// Filter Tabs Handling
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    activeFilter = e.target.dataset.filter;
    renderAppointments();
  });
});

// Notifications Dropdown Toggle
notifBell.addEventListener("click", () => {
  notifTray.classList.toggle("hidden");
});

clearNotifsBtn.addEventListener("click", () => {
  notifications = [];
  saveState();
  renderNotifications();
});

// Init
renderAppointments();
renderNotifications();