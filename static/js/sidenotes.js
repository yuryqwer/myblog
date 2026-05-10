(function () {
  'use strict';

  var BREAKPOINT = 1400;

  function isWide() {
    return window.innerWidth >= BREAKPOINT;
  }

  function setupSideNotes() {
    var footnotes = document.querySelector('.footnotes');
    var sidebar = document.getElementById('sidebar-left');
    if (!footnotes || !sidebar) return;

    var items = footnotes.querySelectorAll('li[id^="fn:"]');
    items.forEach(function (li) {
      var fnId = li.id;
      var refAnchor = document.querySelector('sup a[href="#' + fnId + '"]');
      if (!refAnchor) return;

      var fnContent = li.querySelector('p').cloneNode(true);
      var backref = fnContent.querySelector('.footnote-backref');
      if (backref) backref.remove();

      var sidenote = document.createElement('div');
      sidenote.className = 'sidenote-inline';
      sidenote.setAttribute('data-fn-id', fnId);

      var num = document.createElement('sup');
      num.textContent = fnId.replace('fn:', '');
      num.className = 'sidenote-num';
      sidenote.appendChild(num);
      sidenote.appendChild(fnContent);

      sidebar.appendChild(sidenote);
    });

    footnotes.style.display = 'none';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        updateSidenotePositions();
      });
    });
  }

  function updateSidenotePositions() {
    var sidebar = document.getElementById('sidebar-left');
    if (!sidebar) return;

    var sidebarRect = sidebar.getBoundingClientRect();
    var gap = 16;
    var noteWidth = sidebarRect.width - gap * 2;

    var notes = document.querySelectorAll('.sidenote-inline');
    for (var i = 0; i < notes.length; i++) {
      var fnId = notes[i].getAttribute('data-fn-id');
      var ref = document.querySelector('sup a[href="#' + fnId + '"]');
      if (!ref) continue;

      var refRect = ref.getBoundingClientRect();
      notes[i].style.top = (refRect.top - sidebarRect.top) + 'px';
      notes[i].style.left = gap + 'px';
      notes[i].style.width = Math.max(noteWidth, 100) + 'px';
    }
  }

  function cleanupSideNotes() {
    var notes = document.querySelectorAll('.sidenote-inline');
    for (var i = 0; i < notes.length; i++) {
      notes[i].remove();
    }
    var footnotes = document.querySelector('.footnotes');
    if (footnotes) footnotes.style.display = '';
  }

  function moveTOC() {
    var toc = document.querySelector('.post-container > .toc, #sidebar-right .toc');
    var sidebarRight = document.getElementById('sidebar-right');
    if (!toc || !sidebarRight) return;

    if (isWide()) {
      sidebarRight.appendChild(toc);
    } else {
      var container = document.querySelector('.post-container');
      if (container) {
        container.appendChild(toc);
      }
    }
  }

  var wasWide = isWide();
  var initialized = false;

  function handleLayout() {
    var hasPostContainer = document.querySelector('.post-container');
    if (!hasPostContainer) return;

    var wide = isWide();
    if (wide !== wasWide || !initialized) {
      wasWide = wide;
      initialized = true;

      if (wide) {
        cleanupSideNotes();
        setupSideNotes();
        moveTOC();
      } else {
        cleanupSideNotes();
        moveTOC();
      }
    }
  }

  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      requestAnimationFrame(function () {
        if (isWide()) updateSidenotePositions();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });

  var debounceTimer;
  function onResize() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      handleLayout();
      if (isWide()) updateSidenotePositions();
    }, 200);
  }

  document.addEventListener('DOMContentLoaded', handleLayout);
  window.addEventListener('resize', onResize);
  window.addEventListener('load', function () {
    if (isWide()) updateSidenotePositions();
  });

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    handleLayout();
  }
})();
