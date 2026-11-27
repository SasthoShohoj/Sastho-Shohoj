
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const identity = document.getElementById("loginIdentity").value.trim();
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");

    function showError(text) {
        message.style.color = "#dc2626";
        message.textContent = text;
    }

    if (!identity) {
        showError("Please enter your email or phone number.");
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^(?:\+8801|01)[3-9]\d{8}$/;

    if (!emailPattern.test(identity) && !phonePattern.test(identity)) {
        showError("Please enter a valid email or Bangladesh phone number.");
        return;
    }

    if (!password.trim()) {
        showError("Please enter your password.");
        return;
    }

    message.style.color = "#087f8c";
    message.textContent =
        "Input validation successful! Actual login requires backend authentication.";
});

// Show / Hide Password
const toggleButtons = document.querySelectorAll(".toggle-password");

toggleButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const targetId = button.dataset.target;
        const passwordInput = document.getElementById(targetId);

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            button.textContent = "Hide";
        } else {
            passwordInput.type = "password";
            button.textContent = "Show";
        }

    });

});
