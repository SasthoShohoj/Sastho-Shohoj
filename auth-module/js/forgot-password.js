
const forgotForm = document.getElementById("forgotForm");

forgotForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const identity = document.getElementById("resetIdentity").value.trim();
    const message = document.getElementById("forgotMessage");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^(?:\+8801|01)[3-9]\d{8}$/;

    if (!emailPattern.test(identity) && !phonePattern.test(identity)) {

        message.style.color = "#dc2626";
        message.textContent =
            "Please enter a valid email or Bangladesh phone number.";

        return;
    }

    message.style.color = "#087f8c";

    message.textContent =
        "Your information is valid. Actual password recovery will be available after backend integration.";

});
