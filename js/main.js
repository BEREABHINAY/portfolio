/* ============================================================
   main.js — shared site interactions
   ============================================================ */

(function(){
  /* Run before paint: if we're arriving via a warped transition,
     keep #page-content hidden/blurred immediately (no flash),
     CSS handles the actual look via the .incoming class. */
  if(sessionStorage.getItem('pageTransition') === '1'){
    document.documentElement.classList.add('incoming');
  }
})();

function isInternalPageLink(a){
  if(!a) return false;
  if(a.hasAttribute('download')) return false;
  if(a.target === '_blank') return false;
  var href = a.getAttribute('href') || '';
  if(!href || href.charAt(0) === '#') return false;
  if(href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return false;
  if(href.indexOf('http://') === 0 || href.indexOf('https://') === 0) return false;
  if(href.indexOf('.html') === -1) return false;
  return true;
}

document.addEventListener('DOMContentLoaded', function(){

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pageContent = document.getElementById('page-content');
  var transitioning = false;

  /* ---------- entry: settle in from a warped arrival ---------- */
  var arrivedWarped = sessionStorage.getItem('pageTransition') === '1';
  sessionStorage.removeItem('pageTransition');
  if(arrivedWarped && !reduceMotion){
    requestAnimationFrame(function(){
      setTimeout(function(){
        document.documentElement.classList.remove('incoming');
        if(window.spaceBG && window.spaceBG.warpIn) window.spaceBG.warpIn(800);
      }, 80);
    });
  } else {
    document.documentElement.classList.remove('incoming');
  }

  /* ---------- exit: warp into the scene, then navigate ---------- */
  document.addEventListener('click', function(e){
    var a = e.target.closest('a');
    if(!isInternalPageLink(a) || transitioning) return;
    if(reduceMotion) return; /* let the browser navigate instantly */

    e.preventDefault();
    transitioning = true;
    var href = a.getAttribute('href');

    if(pageContent) pageContent.classList.add('content-warping');
    if(window.spaceBG && window.spaceBG.warpOut){
      window.spaceBG.warpOut(620);
    }
    sessionStorage.setItem('pageTransition', '1');
    setTimeout(function(){ window.location.href = href; }, 640);
  });

  /* ---------- mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ links.classList.remove('open'); });
    });
  }

  /* ---------- active link highlight ---------- */
  var current = (window.location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a').forEach(function(a){
    var href = a.getAttribute('href');
    if(href === current || (current === '' && href === 'index.html')){
      a.classList.add('active');
    }
  });

  /* ---------- scroll reveal ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');
  if(reduceMotion){
    revealEls.forEach(function(el){ el.classList.add('in'); });
  } else if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- hero name 3D mouse tilt ---------- */
  var heroName = document.getElementById('heroName');
  if(heroName && !reduceMotion){
    document.addEventListener('mousemove', function(e){
      var dx = (e.clientX / window.innerWidth - 0.5);
      var dy = (e.clientY / window.innerHeight - 0.5);
      heroName.style.transform =
        'rotateY(' + (dx * 10) + 'deg) rotateX(' + (-dy * 10) + 'deg)';
    });
    document.addEventListener('mouseleave', function(){
      heroName.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  }

  /* ---------- certificate lightbox (3D viewer) ---------- */
  var certImgs = document.querySelectorAll('.cert-img');
  if(certImgs.length){
    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML =
      '<button class="lightbox-close" aria-label="Close">&times;</button>' +
      '<div class="lightbox-stage">' +
        '<img alt="">' +
        '<div class="lightbox-caption"></div>' +
      '</div>';
    document.body.appendChild(lightbox);

    var stage = lightbox.querySelector('.lightbox-stage');
    var lbImg = lightbox.querySelector('img');
    var lbCaption = lightbox.querySelector('.lightbox-caption');
    var closeBtn = lightbox.querySelector('.lightbox-close');
    var lbOpen = false;

    function openLightbox(src, alt){
      lbImg.src = src;
      lbImg.alt = alt || '';
      lbCaption.textContent = alt || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      lbOpen = true;
      lbImg.classList.remove('is-shown');
      lbCaption.classList.remove('is-shown');
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          lbImg.classList.add('is-shown');
          lbCaption.classList.add('is-shown');
        });
      });
    }
    function closeLightbox(){
      lbImg.classList.remove('is-shown');
      lbCaption.classList.remove('is-shown');
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      lbOpen = false;
    }

    certImgs.forEach(function(img){
      img.setAttribute('data-lightbox-trigger', '');
      img.addEventListener('click', function(){
        openLightbox(img.getAttribute('src'), img.getAttribute('alt'));
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(e){
      if(e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && lbOpen) closeLightbox();
    });

    if(!reduceMotion){
      stage.addEventListener('mousemove', function(e){
        if(!lbOpen) return;
        var rect = stage.getBoundingClientRect();
        var dx = (e.clientX - rect.left) / rect.width - 0.5;
        var dy = (e.clientY - rect.top) / rect.height - 0.5;
        lbImg.style.transform = 'scale(1.03) rotateY(' + (dx * 14) + 'deg) rotateX(' + (-dy * 14) + 'deg)';
      });
      stage.addEventListener('mouseleave', function(){
        if(lbOpen) lbImg.style.transform = 'scale(1) rotateY(0deg) rotateX(0deg)';
      });
    }
  }

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById('year');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

  /* ---------- contact form -> mailto ---------- */
  var form = document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = document.getElementById('cf-name').value.trim();
      var email = document.getElementById('cf-email').value.trim();
      var message = document.getElementById('cf-message').value.trim();
      var subject = encodeURIComponent('Portfolio enquiry from ' + (name || 'a visitor'));
      var body = encodeURIComponent(message + '\n\n— ' + name + ' (' + email + ')');
      window.location.href = 'mailto:abhinayvarma11.6@mail.com?subject=' + subject + '&body=' + body;
    });
  }
});
