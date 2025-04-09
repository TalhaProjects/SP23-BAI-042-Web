const form = document.getElementById('checkoutForm');

form.addEventListener('submit', function(event) {
  event.preventDefault();

  // Clear previous errors
  document.querySelectorAll('.error').forEach(span => span.textContent = '');
  document.querySelectorAll('input').forEach(input => input.classList.remove('invalid'));

  let isValid = true;

  // Full Name
  const fullName = form.fullName;
  if (!/^[A-Za-z\s]+$/.test(fullName.value)) {
    showError(fullName, "Full Name should contain only letters.");
    isValid = false;
  }

  // Email
  const email = form.email;
  if (!email.validity.valid) {
    showError(email, "Enter a valid email address.");
    isValid = false;
  }

  // Phone Number
  const phone = form.phone;
  if (!/^\d{10,15}$/.test(phone.value)) {
    showError(phone, "Phone number must be 10 to 15 digits.");
    isValid = false;
  }

  // Address
  const address = form.address;
  if (!address.value.trim()) {
    showError(address, "Address is required.");
    isValid = false;
  }

  // Credit Card Number
  const card = form.cardNumber;
  if (!/^\d{16}$/.test(card.value)) {
    showError(card, "Credit card must be exactly 16 digits.");
    isValid = false;
  }

  // Expiry Date
  const expiry = form.expiry;
  const today = new Date();
  const [expYear, expMonth] = expiry.value.split("-").map(Number);
  const expiryDate = new Date(expYear, expMonth - 1);
  if (expiryDate < today) {
    showError(expiry, "Expiry date must be in the future.");
    isValid = false;
  }

  // CVV
  const cvv = form.cvv;
  if (!/^\d{3}$/.test(cvv.value)) {
    showError(cvv, "CVV must be exactly 3 digits.");
    isValid = false;
  }

  if (isValid) {
    alert("Form submitted successfully!");
    form.reset();
  }
});

function showError(input, message) {
  input.classList.add('invalid');
  document.getElementById(input.id + "Error").textContent = message;
}