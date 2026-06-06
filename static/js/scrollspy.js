document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var toc = document.querySelector('.toc');
  if (!toc) return;

  var headings = document.querySelectorAll('.post-content h2[id], .post-content h3[id]');
  if (!headings.length) return;

  // Build heading ID → TOC <a> map
  var linkMap = {};
  toc.querySelectorAll('a[href^="#"]').forEach(function (a) {
    linkMap[a.getAttribute('href').replace('#', '')] = a;
  });

  var activeLink = null;
  var ticking = false;

  function setActive(id) {
    if (activeLink) {
      activeLink.classList.remove('active');
      var oldLi = activeLink.closest('li');
      if (oldLi) oldLi.classList.remove('active');
    }
    var link = linkMap[id];
    if (link) {
      link.classList.add('active');
      var li = link.closest('li');
      if (li) li.classList.add('active');
      activeLink = link;
    }
  }

  function update() {
    var threshold = 100;

    // Find the last heading whose top edge has passed the threshold
    var current = null;
    for (var i = headings.length - 1; i >= 0; i--) {
      if (headings[i].getBoundingClientRect().top <= threshold) {
        current = headings[i];
        break;
      }
    }

    if (current) {
      setActive(current.id);
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });

  // Initial highlight
  update();
});
