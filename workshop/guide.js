// Workshop guide — shared behavior.

// Copy buttons on paste blocks.
document.querySelectorAll('.code').forEach(function (block) {
  var btn = block.querySelector('.copy');
  var code = block.querySelector('code');
  if (!btn || !code) return;
  btn.addEventListener('click', function () {
    navigator.clipboard.writeText(code.innerText).then(function () {
      btn.textContent = 'Copied';
      btn.classList.add('done');
      setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('done'); }, 1600);
    });
  });
});

// Screenshot placeholders: show the dashed box until the image file exists.
document.querySelectorAll('figure.shot img').forEach(function (img) {
  img.addEventListener('error', function () {
    img.closest('figure').classList.add('missing');
  });
});

// Checkpoint checkboxes remember their state per page.
document.querySelectorAll('.checkpoint input[type="checkbox"]').forEach(function (box, i) {
  var key = 'guide:' + location.pathname + ':' + i;
  try {
    box.checked = localStorage.getItem(key) === '1';
    box.addEventListener('change', function () {
      localStorage.setItem(key, box.checked ? '1' : '0');
    });
  } catch (e) { /* private mode: checkboxes still work, just don't persist */ }
});
