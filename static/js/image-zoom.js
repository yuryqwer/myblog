document.addEventListener("DOMContentLoaded", function () {
  var images = document.querySelectorAll(".post-content img, .article-content img");

  images.forEach(function (img) {
    var link = document.createElement("a");
    link.href = img.src;
    link.classList.add("lightgallery");
    link.setAttribute("data-lg-id", "gallery-1");
    link.setAttribute("aria-label", img.alt || "");
    img.parentNode.insertBefore(link, img);
    link.appendChild(img);
  });

  var plugins = [];
  if (typeof lgZoom !== 'undefined') plugins.push(lgZoom);
  if (typeof lgRotate !== 'undefined') plugins.push(lgRotate);

  if (plugins.length === 0) return;

  lightGallery(document.body, {
    selector: ".lightgallery",
    plugins: plugins,
    animateThumb: false,
    toggleThumb: false,
    speed: 500
  });
});
