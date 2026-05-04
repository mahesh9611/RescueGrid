const etaElement = document.getElementById('eta');
const simulateBtn = document.getElementById('simulateBtn');
const trackingMessage = document.getElementById('trackingMessage');
const resourceButtons = document.querySelectorAll('.resource-btn');
const resourceDetails = document.getElementById('resourceDetails');
const hospitalSearch = document.getElementById('hospitalSearch');
const micBtn = document.getElementById('micBtn');
const patientAlertBtn = document.getElementById('patientAlertBtn');
const patientEmergencyDropdown = document.getElementById('patientEmergencyDropdown');
const patientEmergencyType = document.getElementById('patientEmergencyType');
const hospitalList = document.getElementById('hospitalList');
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

// Carousel variables
const carousel = document.getElementById('carousel');
const carouselDots = document.getElementById('carouselDots');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const hamburger = document.getElementById('hamburger');
const siteNav = document.getElementById('siteNav');
const carouselSlides = document.querySelectorAll('.carousel-slide');

let currentSlide = 0;
const totalSlides = carouselSlides.length;

const resourceData = {
  beds: [
    'City General Hospital — 12 beds available',
    'Rescue Health Center — 8 beds available',
    'Sunrise Emergency Care — 15 beds available'
  ],
  icu: [
    'City General Hospital — 4 ICU beds available',
    'Rescue Health Center — 2 ICU beds available',
    'Sunrise Emergency Care — 5 ICU beds available'
  ],
  oxygen: [
    'City General Hospital — 18 oxygen cylinders ready',
    'Rescue Health Center — 12 oxygen cylinders ready',
    'Sunrise Emergency Care — 20 oxygen cylinders ready'
  ],
  blood: [
    'City General Hospital — Type O+ (10 units), A+ (8 units)',
    'Rescue Health Center — Type B+ (7 units), AB+ (5 units)',
    'Sunrise Emergency Care — Type A- (6 units), O- (4 units)'
  ]
};

const trackingStates = [
  {eta: 8, message: 'Ambulance 4.2 km from patient pickup point.', position: 0},
  {eta: 6, message: 'Ambulance is 3.1 km away. Preparing stretcher and oxygen.', position: 25},
  {eta: 4, message: 'Ambulance nearby. Hospital notified to ready ICU and blood.', position: 50},
  {eta: 2, message: 'Ambulance arriving soon. Patient condition: high fever / chest pain.', position: 75},
  {eta: 0, message: 'Ambulance has reached the patient. Transferring to hospital.', position: 100}
];

const hospitals = [
  {name: 'City General Hospital', distance: '2.3 km', status: 'Emergency ready', doctor: 'Dr. Sharma', doctorStatus: 'available', lastUpdate: '2 min ago'},
  {name: 'Rescue Health Center', distance: '3.8 km', status: 'ICU available', doctor: 'Dr. Patel', doctorStatus: 'busy', lastUpdate: '5 min ago'},
  {name: 'Sunrise Emergency Care', distance: '4.1 km', status: 'Full capacity', doctor: 'All doctors', doctorStatus: 'occupied', lastUpdate: '1 min ago'},
  {name: 'Metro Medical Institute', distance: '5.2 km', status: 'Normal operations', doctor: 'Dr. Kumar', doctorStatus: 'available', lastUpdate: '3 min ago'}
];

let trackingStep = 0;

function renderResource(type) {
  const description = {
    beds: 'Beds available across nearby hospitals',
    icu: 'ICU capacity in partner hospitals',
    oxygen: 'Oxygen support ready for emergency cases',
    blood: 'Blood inventory available at each hospital'
  };

  const items = resourceData[type] || [];
  resourceDetails.innerHTML = `
    <div class="resource-summary">${description[type]}</div>
    <div class="resource-list">
      ${items.map(item => `<div>${item}</div>`).join('')}
    </div>
  `;
}

function updateMapPosition(position) {
  const mapRoute = document.querySelector('.map-route');
  if (mapRoute) {
    mapRoute.style.setProperty('--progress', `${position}%`);
  }
}

function renderHospitalList(filteredHospitals = hospitals) {
  hospitalList.innerHTML = filteredHospitals.map(hospital => `
    <div class="hospital-item">
      <div class="hospital-info">
        <h4>${hospital.name}</h4>
        <p>${hospital.distance} away • ${hospital.status}</p>
        <div class="availability">
          <span class="doctor-status">${getDoctorStatusIcon(hospital.doctorStatus)} ${hospital.doctor} ${hospital.doctorStatus}</span>
          <span class="timestamp">Updated ${hospital.lastUpdate}</span>
        </div>
      </div>
      <div class="alert-actions">
        <button class="alert-btn sms" data-hospital="${hospital.name}">📱 SMS</button>
        <button class="alert-btn whatsapp" data-hospital="${hospital.name}">💬 WhatsApp</button>
      </div>
    </div>
  `).join('');

  // Re-attach event listeners for alert buttons
  document.querySelectorAll('.alert-btn').forEach(btn => {
    btn.addEventListener('click', handleAlert);
  });
}

function getDoctorStatusIcon(status) {
  switch(status) {
    case 'available': return '🟢';
    case 'busy': return '🟡';
    case 'occupied': return '🔴';
    default: return '⚪';
  }
}

function handleAlert(event) {
  const hospital = event.target.dataset.hospital;
  const channel = event.target.classList.contains('sms') ? 'SMS' : 'WhatsApp';
  const emergency = (patientEmergencyType && patientEmergencyType.value) ? patientEmergencyType.value : 'urgent assistance needed';

  if (patientEmergencyType && !patientEmergencyType.value) {
    alert('Please select an emergency type before sending the alert.');
    return;
  }

  const message = `🚨 EMERGENCY ALERT 🚨\n\nPatient needs immediate assistance!\nEmergency type: ${emergency}\nLocation: Current GPS coordinates\n\nPlease prepare resources and standby.\n\nSent via RescueGrid`;

  if (channel === 'SMS') {
    alert(`SMS sent to ${hospital}:\n\n${message}`);
  } else {
    alert(`WhatsApp message sent to ${hospital}:\n\n${message}`);
  }
}

function fuzzySearch(query, items) {
  const lowerQuery = query.toLowerCase();
  return items.filter(item => {
    const name = item.name.toLowerCase();
    const status = item.status.toLowerCase();
    const doctor = item.doctor.toLowerCase();

    // Simple fuzzy matching - check if query letters appear in sequence
    let queryIndex = 0;
    for (let char of name + ' ' + status + ' ' + doctor) {
      if (char === lowerQuery[queryIndex]) {
        queryIndex++;
        if (queryIndex === lowerQuery.length) return true;
      }
    }
    return queryIndex === lowerQuery.length;
  });
}

resourceButtons.forEach(button => {
  button.addEventListener('click', () => {
    resourceButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    renderResource(button.dataset.resource);
  });
});


if (hospitalSearch) {
  hospitalSearch.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length > 0) {
      const filtered = fuzzySearch(query, hospitals);
      renderHospitalList(filtered);
    } else {
      renderHospitalList();
    }
  });
}

if (micBtn) {
  micBtn.addEventListener('click', () => {
    // Simulate voice search
    const voiceQueries = ['city general', 'icu available', 'emergency care', 'doctor sharma'];
    const randomQuery = voiceQueries[Math.floor(Math.random() * voiceQueries.length)];

    hospitalSearch.value = randomQuery;
    const filtered = fuzzySearch(randomQuery, hospitals);
    renderHospitalList(filtered);

    // Visual feedback
    micBtn.textContent = '🎙️';
    setTimeout(() => {
      micBtn.textContent = '🎤';
    }, 1000);
  });
}

if (patientAlertBtn) {
  patientAlertBtn.addEventListener('click', () => {
    const isVisible = patientEmergencyDropdown.style.display === 'block';
    patientEmergencyDropdown.style.display = isVisible ? 'none' : 'block';
    patientAlertBtn.textContent = isVisible ? '🚨 Send Emergency Alert' : '🚨 Select Emergency Type';
  });
}

if (simulateBtn) {
  simulateBtn.addEventListener('click', () => {
    trackingStep = (trackingStep + 1) % trackingStates.length;
    const state = trackingStates[trackingStep];
    etaElement.textContent = `${state.eta} min`;
    trackingMessage.textContent = state.message;
    updateMapPosition(state.position);
    simulateBtn.textContent = trackingStep === trackingStates.length - 1 ? 'Restart tracking' : 'Update live tracking';
  });
}

// Carousel Functions
function initCarouselDots() {
  carouselDots.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('button');
    dot.className = `carousel-dot ${i === currentSlide ? 'active' : ''}`;
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-selected', i === currentSlide ? 'true' : 'false');
    dot.addEventListener('click', () => goToSlide(i));
    carouselDots.appendChild(dot);
  }
}

function updateCarousel() {
  if (!carousel) return;
  carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
  const dots = document.querySelectorAll('.carousel-dot');
  dots.forEach((dot, index) => {
    const isActive = index === currentSlide;
    dot.classList.toggle('active', isActive);
    dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // Update ARIA live region for screen readers
  const carouselElement = document.getElementById('carousel');
  if (carouselElement && carouselElement.children[currentSlide]) {
    const currentSlideElement = carouselElement.children[currentSlide];
    const caption = currentSlideElement.querySelector('.carousel-caption');
    if (caption) {
      carouselElement.setAttribute('aria-label', `Emergency healthcare gallery - ${caption.textContent}`);
    }
  }
}

function nextSlide() {
  if (!carousel || totalSlides === 0) return;
  currentSlide = (currentSlide + 1) % totalSlides;
  updateCarousel();
}

function prevSlide() {
  if (!carousel || totalSlides === 0) return;
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  updateCarousel();
}

function goToSlide(index) {
  if (!carousel || totalSlides === 0) return;
  currentSlide = index;
  updateCarousel();
}

// Auto-rotate carousel every 5 seconds
let carouselAutoPlay;

function startCarouselAutoPlay() {
  carouselAutoPlay = setInterval(nextSlide, 5000);
}

function pauseAutoPlay() {
  clearInterval(carouselAutoPlay);
  startCarouselAutoPlay();
}

// Keyboard navigation for carousel
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    prevSlide();
    pauseAutoPlay();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    nextSlide();
    pauseAutoPlay();
  }
});

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    prevSlide();
    pauseAutoPlay();
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    nextSlide();
    pauseAutoPlay();
  });
}

// Hamburger Menu
if (hamburger) {
  hamburger.addEventListener('click', () => {
    const isExpanded = hamburger.classList.toggle('active');
    siteNav.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isExpanded);
  });
}

// Close mobile menu when clicking a link
if (siteNav) {
  const navLinks = siteNav.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      siteNav.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// Close mobile menu on window resize
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    hamburger.classList.remove('active');
    siteNav.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Scroll to Top Button
const scrollToTopBtn = document.getElementById('scrollToTop');

function toggleScrollToTop() {
  if (window.pageYOffset > 300) {
    scrollToTopBtn.classList.add('visible');
  } else {
    scrollToTopBtn.classList.remove('visible');
  }
}

if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

window.addEventListener('scroll', toggleScrollToTop);

// Intersection Observer for animations (if supported)
if ('IntersectionObserver' in window) {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  // Observe sections for animation
  document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
  });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize carousel if elements exist
  if (carousel && carouselSlides.length > 0) {
    initCarouselDots();
    updateCarousel();
    startCarouselAutoPlay();
  }

  // Initialize emergency modal functionality
  const emergencyModal = document.getElementById('emergencyModal');
  const modalClose = document.getElementById('modalClose');
  const modalOk = document.getElementById('modalOk');
  const emergencyText = document.getElementById('emergencyText');

  let selectedHospital = '';
  let selectedEmergencyType = '';

  // Handle SMS and WhatsApp button clicks
  document.querySelectorAll('.alert-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      selectedHospital = this.getAttribute('data-hospital');
      const alertType = this.classList.contains('sms') ? 'SMS' : 'WhatsApp';

      // Get emergency type from dropdown if available
      const emergencySelect = document.getElementById('patientEmergencyType');
      selectedEmergencyType = emergencySelect ? emergencySelect.value : 'Emergency';

      // Show modal with appropriate message
      showEmergencyModal(selectedHospital, alertType, selectedEmergencyType);
    });
  });

  // Show emergency modal
  function showEmergencyModal(hospital, alertType, emergencyType) {
    const emergencyLabel = emergencyType !== 'Emergency' ? emergencyType : 'Emergency';
    const message = `🚨 ${emergencyLabel} emergency alert sent to ${hospital} via ${alertType}!

"This ${emergencyLabel.toLowerCase()} emergency is coming to your hospital. Be prepared for the patient's arrival and ensure all necessary medical resources are ready."`;

    emergencyText.textContent = message;
    emergencyModal.style.display = 'flex';

    // Add animation class
    emergencyModal.classList.add('animate-in');

    // Focus management
    modalClose.focus();
  }

  // Close modal functions
  function closeEmergencyModal() {
    emergencyModal.style.display = 'none';
    emergencyModal.classList.remove('animate-in');
  }

  if (modalClose) modalClose.addEventListener('click', closeEmergencyModal);
  if (modalOk) modalOk.addEventListener('click', closeEmergencyModal);

  // Close modal when clicking outside
  if (emergencyModal) {
    emergencyModal.addEventListener('click', function(e) {
      if (e.target === emergencyModal) {
        closeEmergencyModal();
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && emergencyModal && emergencyModal.style.display === 'flex') {
      closeEmergencyModal();
    }
  });
});

if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();

    // Get form data
    const formData = new FormData(contactForm);
    const name = formData.get('name').trim();
    const email = formData.get('email').trim();
    const message = formData.get('message').trim();

    // Basic validation
    let isValid = true;
    const errors = [];

    if (!name) {
      errors.push('Name is required');
      isValid = false;
    }

    if (!email) {
      errors.push('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address');
      isValid = false;
    }

    if (!message) {
      errors.push('Message is required');
      isValid = false;
    }

    if (!isValid) {
      formMessage.textContent = errors.join('. ');
      formMessage.style.color = '#ef4444';
      return;
    }

    // Show loading state
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
      formMessage.textContent = `Thank you, ${name}! Your inquiry has been received. We will respond within 24 hours.`;
      formMessage.style.color = 'var(--success)';
      contactForm.reset();
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }, 2000);
  });
}
