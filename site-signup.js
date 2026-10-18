/* Email sign-up on note pages: posts to MailerLite through a hidden iframe
   so the reader stays on the page, then shows a confirmation line. */
(function () {
  var form = document.getElementById('signup-form');
  var msg = document.getElementById('signup-msg');
  if (!form || !msg) { return; }
  form.addEventListener('submit', function () {
    if (!form.checkValidity()) { return; }
    setTimeout(function () {
      msg.textContent = 'Thank you. Check your inbox to confirm your subscription.';
      msg.style.display = 'block';
      var email = form.querySelector('input[type=email]');
      if (email) { email.value = ''; }
    }, 400);
  });
})();
