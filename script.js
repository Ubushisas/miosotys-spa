
document.addEventListener("DOMContentLoaded", () => {
  // Check if welcome overlay should be shown
  const shouldShowWelcome = !sessionStorage.getItem('welcomeShown');
  const overlay = document.getElementById('welcomeOverlay');

  // Temporarily disabled for testing - overlay shows every time
  /*if (!shouldShowWelcome && overlay) {
    // Hide overlay immediately if user has already seen it
    overlay.style.display = 'none';
  }*/
  // Overlay stays visible waiting for user interaction


  const totalSlides = 8;
  let currentSlide = 1;
  let isAnimating = false;
  let scrollAllowed = true;
  let lastScrollTime = 0;

  const slideTitles = [
    "Bienvenida",
    "Spa Individual",
    "Spa para Parejas",
    "Spa para Amigas",
    "Spa para Niñas",
    "Spa para Familias",
    "Spa Luxury",
    "Eventos Especiales",
  ];

  const slideDescriptions = [
    "Tu oasis de tranquilidad",
    "Bienestar personal",
    "Momentos íntimos",
    "Diversión entre amigas",
    "Experiencias mágicas",
    "Unidos en relajación",
    "Lujo extraordinario",
    "Celebraciones especiales",
  ];

  const imageNames = [
    "Pictures_test /dos.jpg",
    "Individual.jpg", 
    "Couples.jpg",
    "Friends.jpg?v=2",
    "Kids.jpg",
    "Family.jpg",
    "Luxury.jpg",
    "SpecialEvents.jpg"
  ];

  function createSlide(slideNumber, direction) {
    const slide = document.createElement("div");
    slide.className = "slide";

    const slideBgImg = document.createElement("div");
    slideBgImg.className = "slide-bg-img";

    const img = document.createElement("img");
    const imageName = imageNames[slideNumber - 1];
    if (imageName.includes("Pictures_test")) {
      img.src = `./Test_Images/${imageName}`;
    } else {
      img.src = `./Test_Images/Test2/${imageName}`;
    }
    img.alt = "";

    slideBgImg.appendChild(img);
    slide.appendChild(slideBgImg);

    if (direction === "down") {
      slideBgImg.style.clipPath =
        "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";
    } else {
      slideBgImg.style.clipPath = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)";
    }

    return slide;
  }

  function createMainImageWrapper(slideNumber, direction) {
    const wrapper = document.createElement("div");
    wrapper.className = "slide-main-img-wrapper";

    const img = document.createElement("img");
    const imageName = imageNames[slideNumber - 1];
    if (imageName.includes("Pictures_test")) {
      img.src = `./Test_Images/${imageName}`;
    } else {
      img.src = `./Test_Images/Test2/${imageName}`;
    }
    img.alt = "";

    wrapper.appendChild(img);

    if (direction === "down") {
      wrapper.style.clipPath = "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)";
    } else {
      wrapper.style.clipPath =
        "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";
    }

    return wrapper;
  }

  function createTextElements(slideNumber, direction, isMobile) {
    const newTitle = document.createElement("h1");
    newTitle.textContent = slideTitles[slideNumber - 1];

    gsap.set(newTitle, {
      y: direction === "down" ? 80 : -80,
      x: isMobile ? "-50%" : "0%"
    });

    const newDescription = document.createElement("p");
    newDescription.textContent = slideDescriptions[slideNumber - 1];
    gsap.set(newDescription, {
      y: direction === "down" ? 40 : -40,
      x: isMobile ? "-50%" : "0%"
    });

    const newCounter = document.createElement("p");
    newCounter.textContent = slideNumber;
    gsap.set(newCounter, {
      y: direction === "down" ? 30 : -30,
    });

    return { newTitle, newDescription, newCounter };
  }

  function animateSlide(direction) {
    if (isAnimating || !scrollAllowed) return;

    isAnimating = true;
    scrollAllowed = false;

    // Check if mobile for centering
    const isMobile = window.innerWidth <= 768;

    const slider = document.querySelector(".slider");
    const currentSlideElement = slider.querySelector(".slide");
    const mainImageContainer = document.querySelector(".slide-main-img");
    const currentMainWrapper = mainImageContainer.querySelector(
      ".slide-main-img-wrapper"
    );

    const titleContainer = document.querySelector(".slide-title");
    const descriptionContainer = document.querySelector(".slide-description");
    const counterContainer = document.querySelector(".count");

    const currentTitle = titleContainer.querySelector("h1");
    const currentDescription = descriptionContainer.querySelector("p");
    const currentCounter = counterContainer.querySelector("p");

    if (direction === "down") {
      currentSlide = currentSlide === totalSlides ? 1 : currentSlide + 1;
    } else {
      currentSlide = currentSlide === 1 ? totalSlides : currentSlide - 1;
    }

    const newSlide = createSlide(currentSlide, direction);
    const newMainWrapper = createMainImageWrapper(currentSlide, direction);
    const { newTitle, newDescription, newCounter } = createTextElements(
      currentSlide,
      direction,
      isMobile
    );

    slider.appendChild(newSlide);
    mainImageContainer.appendChild(newMainWrapper);
    titleContainer.appendChild(newTitle);
    descriptionContainer.appendChild(newDescription);
    counterContainer.appendChild(newCounter);

    gsap.set(newMainWrapper.querySelector("img"), {
      y: direction === "down" ? "-50%" : "50%",
    });

    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          [
            currentSlideElement,
            currentMainWrapper,
            currentTitle,
            currentDescription,
            currentCounter,
          ].forEach((el) => el?.remove());
        }, 200);

        isAnimating = false;
        setTimeout(() => {
          scrollAllowed = true;
          lastScrollTime = Date.now();
        }, 100);
      },
    });

    tl.to(
      newSlide.querySelector(".slide-bg-img"),
      {
        clipPath:
          direction === "down"
            ? "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)"
            : "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: 1.2,
        ease: "power2.inOut",
      },
      0
    )
      .to(
        currentSlideElement.querySelector("img"),
        {
          scale: 1.2,
          duration: 1.6,
          ease: "power1.out",
        },
        0
      )
      .to(
        newMainWrapper,
        {
          clipPath:
            direction === "down"
              ? "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
              : "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
          duration: 0.9,
          ease: "power2.out",
        },
        0
      )
      .to(
        currentMainWrapper.querySelector("img"),
        {
          y: direction === "down" ? "50%" : "-50%",
          duration: 1,
          ease: "power2.inOut",
        },
        0
      )
      .to(
        newMainWrapper.querySelector("img"),
        {
          y: "0%",
          duration: 0.9,
          ease: "power2.out",
        },
        0
      )
      .to(
        currentTitle,
        {
          y: direction === "down" ? -80 : 80,
          duration: 0.5,
          ease: "power2.in",
        },
        0
      )
      .to(
        newTitle,
        {
          y: 0,
          x: isMobile ? "-50%" : "0%",
          duration: 0.5,
          ease: "power2.out",
        },
        0.5
      )
      .to(
        currentDescription,
        {
          y: direction === "down" ? -40 : 40,
          duration: 0.5,
          ease: "power2.in",
        },
        0
      )
      .to(
        newDescription,
        {
          y: 0,
          x: isMobile ? "-50%" : "0%",
          duration: 0.5,
          ease: "power2.out",
        },
        0.5
      )
      .to(
        currentCounter,
        {
          y: direction === "down" ? -30 : 30,
          duration: 0.3,
          ease: "power2.in",
        },
        0
      )
      .to(
        newCounter,
        {
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        },
        0.3
      );
  }

  function handleScroll(direction) {
    const now = Date.now();
    if (isAnimating || !scrollAllowed) return;
    if (now - lastScrollTime < 800) return;
    lastScrollTime = now;
    animateSlide(direction);
  }

  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? "down" : "up";
      handleScroll(direction);
    },
    { passive: false }
  );

  let touchStartY = 0;
  let isTouchActive = false;

  window.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.touches[0].clientY;
      isTouchActive = true;
    },
    { passive: false }
  );

  window.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      if (!isTouchActive || isAnimating || !scrollAllowed) return;
      const touchCurrentY = e.touches[0].clientY;
      const difference = touchStartY - touchCurrentY;
      if (Math.abs(difference) > 10) {
        isTouchActive = false;
        const direction = difference > 0 ? "down" : "up";
        handleScroll(direction);
      }
    },
    { passive: false }
  );

  window.addEventListener("touchend", () => {
    isTouchActive = false;
  });
});

// Smooth Fade Animation Function
function slideInOut() {
  document.documentElement.animate(
    [
      {
        opacity: 1,
        transform: "translateY(0)",
      },
      {
        opacity: 0.7,
        transform: "translateY(-10%)",
      },
    ],
    {
      duration: 2200,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      fill: "forwards",
      pseudoElement: "::view-transition-old(root)",
    }
  );

  document.documentElement.animate(
    [
      {
        clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",
      },
      {
        clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
      },
    ],
    {
      duration: 2200,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      fill: "forwards",
      pseudoElement: "::view-transition-new(root)",
    }
  );
}

// Navigation to Info Page (No Transition)
function navigateToInfo() {
  window.location.href = 'info.html';
}

// Navigation to Catalogue Page (No Transition)
function navigateToCatalogue() {
  window.location.href = 'catalogo.html';
}


