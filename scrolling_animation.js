document.addEventListener("DOMContentLoaded", function() {
  gsap.registerPlugin(ScrollToPlugin, Observer, ScrollTrigger);

  let $path = document.querySelector(".mat"),
      $plate = document.querySelector(".plate"),
      $fork = document.querySelector(".fork"),
      $knife = document.querySelector(".knife"),
      introSection = document.querySelector("#intro");

  function playAnimation() {
    let tl = gsap.timeline({ repeat: 0, repeatDelay: 0 });
    const start = "M 0 100 V 50 Q 50 0 100 50 V 100 z";
    const end = "M 0 100 V 0 Q 50 0 100 0 V 100 z";

    // Set initial positions (move fork left and knife right)
    gsap.set($fork, { x: "-100%", opacity: 0 });
    gsap.set($knife, { x: "100%", opacity: 0 });

    tl.to($path, { duration: 0.8, attr: { d: start }, ease: "power2.in" })
      .to($path, { duration: 0.4, attr: { d: end }, ease: "power2.out" })
      .from($plate, { duration: 0.8, y: 75, opacity: 1 }, "-=0.8")
      .to([$fork, $knife], { duration: 0.8, x: 0, opacity: 1 }, "-=0.3");

    tl.play();
  }
  
  gsap.to('progress', {
    value: 100,
    ease: 'none',
    scrollTrigger: { scrub: 0.3 }
  });
  
  window.onload = playAnimation;

  ScrollTrigger.create({
    trigger: introSection,
    start: "top 50%",
    onEnterBack: () => {
      playAnimation();
    },
  });

  let q = document.getElementById('question'),
  title = document.getElementById('title'),
  mark = title.querySelector("span"),
  dot = document.querySelector(".dot");

  gsap.set(dot, {
    width: "140vmax", // ensures it fills every part of the screen. 
    height: "140vmax",
    xPercent: -50, // center the dot in the section area
    yPercent: -50,
    top: "50%",
    left: "50%",
    borderRadius: "50%" // Ensure the dot is a circle
  });

  let tl1 = gsap.timeline({
    scrollTrigger: {
        trigger: q,
        start: "top top",
        end: "bottom top",
        scrub: 0.5,
        pin: true, // Pin the trigger element
        pinSpacing: true, // Disable pin spacing to avoid layout shifts
    },
    defaults: { ease: "none" }
  });

  tl1
  .to(title, { opacity: 1 })
  .fromTo(dot, {
    scale: 0,
    x: () => {
      let markBounds = mark.getBoundingClientRect(),
          px = markBounds.left + markBounds.width * 0.40; // dot is about 54% from the left of the bounds of the character
      return px - q.getBoundingClientRect().width / 2;
    },
    y: () => {
      let markBounds = mark.getBoundingClientRect(),
          py = markBounds.top + markBounds.height * 0.73; // dot is about 73% from the top of the bounds of the character
      return py - q.getBoundingClientRect().height / 2;
    }
  }, {
    x: 0,
    y: 0,
    ease: "power3.in",
    scale: 1
  });


  const text = " is a chronic (long-lasting) health condition that affects how your body turns food into energy.";
  let index = 0;
  const typingText = document.getElementById("typing-text");
  let hasTyped = false; // To prevent retriggering

  function type() {
      if (index < text.length) {
          typingText.innerHTML += text.charAt(index);
          index++;
          setTimeout(type, 50); // Adjust speed (lower = faster)
      }
  }

  function handleIntersection(entries, observer) {
      entries.forEach(entry => {
          if (entry.isIntersecting && !hasTyped) {
              hasTyped = true; // Prevents re-triggering
              type();
              observer.unobserve(entry.target); // Stop observing after typing starts
          }
      });
  }

  const observer = new IntersectionObserver(handleIntersection, {
      root: null,  // Observe within the viewport
      threshold: 0.5 // Trigger when 50% of the section is visible
  });

  observer.observe(document.getElementById("diabeties_description"));


  const counters = document.querySelectorAll(".count");
  const stat = document.getElementById("hook"); // Target section

  const animateCounter = (counter) => {
      const target = +counter.getAttribute("data-target");
      const duration = 2000; // 2 seconds
      const increment = target / (duration / 16); // Update every frame (~16ms)

      let current = 0;
      const updateCount = () => {
          current += increment;
          if (current < target) {
              counter.textContent = current.toFixed(1);
              requestAnimationFrame(updateCount);
          } else {
              counter.textContent = target;
          }
      };
      updateCount();
  };

  const observer1 = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              counters.forEach(counter => animateCounter(counter));
              observer.disconnect(); // Stop observing after animation starts
          }
      });
  }, { threshold: 0.5 }); // Trigger when 50% of the section is visible

  observer1.observe(stat);

  let trans = document.querySelector("#transition");
  let tl = gsap.timeline();
  let gp2 = document.querySelector("#goPage2"); // Go to Page 2 Button
  let gb = document.querySelector("#goBack");  // Go Back Button
  let page1 = document.querySelector(".page1");
  let page2 = document.querySelector(".page2");

  // Initially hide Page 2 and show Page 1
  gsap.set(page2, { opacity: 0, display: "none" });
  gsap.set(gb, { opacity: 1, display: "block" }); // Ensure "Go Back" is visible on Page 2

  gp2.addEventListener("click", function () {
    tl.to(trans, { opacity: 1, duration: 0}) // Fade in transition
      .to(trans, { scale: 1000, duration: 0.5 }) // Expand effect
      .set(page1, { opacity: 0, display: "none" }) // Hide Page 1
      .set(page2, { opacity: 1, display: "block" }) // Show Page 2
      .to(trans, { scale: 1, duration: 0.3, backgroundColor: "#6b9ac4" }) // Shrink effect
      .to(trans, { opacity: 0, duration: 0}); // Fade out
  });

  gb.addEventListener("click", function () {
    tl.to(trans, { opacity: 1, duration: 0 }) // Fade in transition
      .to(trans, { scale: 1000, duration: 0.5 }) // Expand effect
      .set(page2, { opacity: 0, display: "none" }) // Hide Page 2
      .set(page1, { opacity: 1, display: "block" }) // Show Page 1
      .to(trans, { scale: 1, duration: 0.3, backgroundColor: "#f4b942" }) // Shrink effect
      .to(trans, { opacity: 0, duration: 0 }); // Fade out
  });

    
  });

document.querySelectorAll(".quiz-question").forEach((container, index) => {
  container.addEventListener("click", function () {
      let hints = document.querySelectorAll(".hint p");
      if (hints[index]) {
          hints[index].classList.add("no-blink");
      }
  });
});


