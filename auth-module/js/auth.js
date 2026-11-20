
const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;
    const message = document.getElementById("formMessage");

    function showError(text) {
        message.style.color = "#dc2626";
        message.textContent = text;
    }

    // Full name validation
    if (fullName.length < 3) {
        showError("Please enter your full name.");
        return;
    }

    // Bangladesh phone number validation
    const phonePattern = /^(?:\+8801|01)[3-9]\d{8}$/;

    if (!phonePattern.test(phone)) {
        showError("Please enter a valid Bangladesh phone number.");
        return;
    }

    // Password length validation
    if (password.length < 10) {
        showError("Password must contain at least 10 characters.");
        return;
    }

    // Confirm password validation
    if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
    }

    // Terms and conditions validation
    if (!terms) {
        showError("Please accept the Terms and Conditions.");
        return;
    }

    // Frontend validation successful
message.style.color = "#087f8c";
message.textContent = "Registration details validated! Redirecting...";

// Store only a temporary workflow marker.
// Do NOT store passwords or personal information.
try {
    sessionStorage.setItem("registrationPending", "true");
    window.location.href = "verify-otp.html";
} catch (error) {
    message.style.color = "#dc2626";
    message.textContent =
        "Unable to continue. Please enable session storage and try again.";
}
});

// Show/Hide Password
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

const passwordField = document.getElementById("password");
const strengthFill = document.getElementById("strengthFill");
const strengthText = document.getElementById("strengthText");

passwordField.addEventListener("input", function() {

    const password = passwordField.value;

    let score = 0;

    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (password.length === 0) {
        strengthFill.style.width = "0%";
        strengthText.textContent = "Password strength";
    }
    else if (score <= 2) {
        strengthFill.style.width = "33%";
        strengthFill.style.background = "#dc2626";
        strengthText.textContent = "Weak password";
        strengthText.style.color = "#dc2626";
    }
    else if (score <= 4) {
        strengthFill.style.width = "66%";
        strengthFill.style.background = "#f59e0b";
        strengthText.textContent = "Medium password";
        strengthText.style.color = "#f59e0b";
    }
    else {
        strengthFill.style.width = "100%";
        strengthFill.style.background = "#16a34a";
        strengthText.textContent = "Strong password";
        strengthText.style.color = "#16a34a";
    }

});
