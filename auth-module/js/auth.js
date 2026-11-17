
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

    // Successful frontend validation
    message.style.color = "#087f8c";
    message.textContent =
        "Validation successful! Registration is not yet connected to a server.";
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
