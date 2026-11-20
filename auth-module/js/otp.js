// Check whether registration has been started
if (sessionStorage.getItem("registrationPending") !== "true") {
    window.location.replace("register.html");
}
const otpForm = document.getElementById("otpForm");
const otpInput = document.getElementById("otp");
const timerDisplay = document.getElementById("timer");
const otpMessage = document.getElementById("otpMessage");
const resendBtn = document.getElementById("resendBtn");
const resendMessage = document.getElementById("resendMessage");

// DEMO ONLY: Replace with backend OTP verification later.
const DEMO_OTP = "123456";

let remainingTime = 300;
let resendCooldown = 30;
let attempts = 0;
const maxAttempts = 5;

let timerInterval;
let resendInterval;
let expired = false;
let blocked = false;
let verified = false;

// Display demo information
resendMessage.textContent =
    "Frontend demo only: use OTP 123456.";

// OTP countdown
function startTimer() {

    clearInterval(timerInterval);

    timerDisplay.textContent = "OTP expires in 05:00";

    timerInterval = setInterval(function() {

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            expired = true;
            timerDisplay.textContent = "OTP has expired.";
            otpMessage.style.color = "#dc2626";
            otpMessage.textContent = "Your OTP has expired. Please request a new one.";
            return;
        }

        remainingTime--;

        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;

        timerDisplay.textContent =
            `OTP expires in ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    }, 1000);
}

// Resend cooldown
function startResendCooldown() {

    clearInterval(resendInterval);

    resendCooldown = 30;
    resendBtn.disabled = true;
    resendBtn.textContent = `Resend in ${resendCooldown}s`;

    resendInterval = setInterval(function() {

        resendCooldown--;

        if (resendCooldown <= 0) {
            clearInterval(resendInterval);
            resendBtn.disabled = false;
            resendBtn.textContent = "Resend OTP";
            return;
        }

        resendBtn.textContent = `Resend in ${resendCooldown}s`;

    }, 1000);
}

// Verify OTP
otpForm.addEventListener("submit", function(event) {

    event.preventDefault();

    otpMessage.textContent = "";

    if (verified || blocked) {
        return;
    }

    if (expired) {
        otpMessage.textContent = "OTP expired. Please request a new one.";
        otpMessage.style.color = "#dc2626";
        return;
    }

    const enteredOTP = otpInput.value;

    if (!/^\d{6}$/.test(enteredOTP)) {
        otpMessage.textContent = "Please enter a valid 6-digit OTP.";
        otpMessage.style.color = "#dc2626";
        return;
    }

    if (attempts >= maxAttempts) {
        blocked = true;
        otpMessage.textContent = "Maximum attempts reached. Please request a new OTP.";
        otpMessage.style.color = "#dc2626";
        return;
    }

    if (enteredOTP === DEMO_OTP) {

    verified = true;

    clearInterval(timerInterval);
    clearInterval(resendInterval);

    // Mark the registration workflow as completed
    sessionStorage.removeItem("registrationPending");

    otpMessage.style.color = "#087f8c";
    otpMessage.textContent =
        "Registration successful! Your account has been verified (frontend demo).";
    
    document.getElementById("successLoginLink").hidden = false;
    otpInput.disabled = true;
    resendBtn.disabled = true;

    // Hide the resend section after success
    resendBtn.style.display = "none";

    return;
}

    attempts++;

    if (attempts >= maxAttempts) {
        blocked = true;
        otpMessage.textContent =
            "Maximum attempts reached. Please request a new OTP.";
    } else {
        otpMessage.textContent =
            `Incorrect OTP. ${maxAttempts - attempts} attempts remaining.`;
    }

    otpMessage.style.color = "#dc2626";

});

// Resend OTP
resendBtn.addEventListener("click", function() {

    if (verified || blocked) {
        return;
    }

    remainingTime = 300;
    expired = false;
    attempts = 0;

    otpInput.value = "";
    otpMessage.textContent = "";

    startTimer();
    startResendCooldown();

    resendMessage.textContent =
        "Demo OTP has been reset. Use 123456.";

});

startTimer();
startResendCooldown();
