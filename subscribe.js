/* Field Notes subscribe — posts to MailerLite through a hidden iframe
   (same pattern as the Make My Promise form) so the reader stays on the page.
   Without JavaScript the form still posts directly to MailerLite. */
(function () {
  var blocks = document.querySelectorAll('.smtr-subscribe');
  if (!blocks.length) return;

  var frame = document.createElement('iframe');
  frame.name = 'ml_subscribe_target';
  frame.title = 'MailerLite subscribe target';
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.cssText = 'display:none;width:0;height:0;border:0;';
  document.body.appendChild(frame);

  Array.prototype.forEach.call(blocks, function (block) {
    var form = block.querySelector('.sub-form');
    if (!form) return;
    form.target = 'ml_subscribe_target';
    form.addEventListener('submit', function () {
      if (!form.checkValidity()) return;
      setTimeout(function () {
        block.classList.add('is-done');
        var msg = block.querySelector('.sub-success');
        if (msg) msg.focus();
      }, 400);
    });
  });
})();
