const audio = new Audio('https://estructuraweb.com.co:9126/live');
audio.autoplay = true;
const playBtn = document.getElementById('playBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumePercentage = document.getElementById('volumePercentage');
const albumArt = document.getElementById('albumArt');
const backgroundArt = document.getElementById('backgroundArt');
const songInfo = document.getElementById('songInfo');
const artistInfo = document.getElementById('artistInfo');
const defaultImage = 'assets/logo.png';
let isPlaying = false;

// PWA and iOS Compatibility Enhancements
let deferredPrompt;
let isIOSDevice = false;
let isStandalone = false;

// Initialize PWA features
document.addEventListener('DOMContentLoaded', function() {
  initializePWA();
  setupIOSOptimizations();
  registerServiceWorker();
  setupOfflineHandling();
  setupInstallPrompt();

  const closeBtn = document.getElementById('closeInstallModal');
  if (closeBtn) closeBtn.addEventListener('click', hideInstallModal);
  const dismissBtn = document.getElementById('dismissInstallBtn');
  if (dismissBtn) dismissBtn.addEventListener('click', hideInstallModal);
  const installBtn = document.getElementById('installAppBtn');
  if (installBtn) installBtn.addEventListener('click', () => {
    installPWA();
    hideInstallModal();
  });
  const installModal = document.getElementById('installModal');
  if (installModal) {
    installModal.addEventListener('click', (event) => {
      if (event.target === installModal) hideInstallModal();
    });
  }
});

// Initialize PWA features
function initializePWA() {
  // Detect iOS
  isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  // Enhanced standalone detection
  isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                 window.navigator.standalone === true ||
                 document.referrer.includes('android-app://');
  
  if (isStandalone) {
    document.documentElement.classList.add('standalone');
    document.body.classList.add('standalone');
    
    // Hide install-related elements
    const appStoreButtons = document.querySelector('.app-store-buttons');
    const installModal = document.getElementById('installModal');
    if (appStoreButtons) {
        appStoreButtons.style.display = 'none';
    }
    if (installModal) {
        installModal.style.display = 'none';
    }
  }
  
  // Handle URL parameters for shortcuts
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'play') {
    setTimeout(() => {
      if (!isPlaying) {
        playBtn.click();
      }
    }, 1000);
  }
}

// Setup iOS optimizations
function setupIOSOptimizations() {
  if (isIOSDevice) {
    document.body.classList.add('ios-device');
    
    // Prevent bounce scrolling
    document.body.addEventListener('touchmove', function(e) {
      if (e.target === document.body) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Handle iOS audio context
    setupIOSAudioContext();
    
    // Optimize for iOS performance
    setupIOSPerformanceOptimizations();
    
    // Handle iOS fullscreen
    setupIOSFullscreen();
  }
}

// Register Service Worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateNotification();
          }
        });
      });
      
      // Setup background sync
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        setupBackgroundSync(registration);
      }
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

// Setup offline handling
function setupOfflineHandling() {
  window.addEventListener('online', () => {
    showNetworkStatus('Conexión restaurada', 'success');
    fetchMetadata();
  });
  
  window.addEventListener('offline', () => {
    showNetworkStatus('Sin conexión a internet', 'warning');
  });
}

// Setup install prompt
function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show modal only when PWA install prompt is available
    if (!isStandalone) {
      const alreadyShown = sessionStorage.getItem('installModalShown');
      if (!alreadyShown) {
        showInstallModal();
        sessionStorage.setItem('installModalShown', 'true');
      }
    }
  });
}

// Show install prompt
function showInstallPrompt() {
  // Empty function since we're not showing the bottom prompt anymore
  // We'll rely only on the modal install prompt
}

// Show iOS install prompt
function showIOSInstallPrompt() {
  const prompt = document.createElement('div');
  prompt.className = 'install-prompt';
  prompt.innerHTML = `
    <div class="install-prompt-text">
      <strong>Instalar Colina Stereo</strong><br>
      Toca el ícono de compartir <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -3px; display: inline-block;"><path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm0 2c1.654 0 3 1.346 3 3v3H9V7c0-1.654 1.346-3 3-3z"></path></svg> y luego "Agregar a la pantalla de inicio"
    </div>
    <div class="install-prompt-buttons">
      <button class="install-btn dismiss" onclick="dismissInstallPrompt()">Entendido</button>
    </div>
  `;
  
  document.body.appendChild(prompt);
  setTimeout(() => prompt.classList.add('show'), 100);
}

// Install Modal logic
function showInstallModal() {
  const modal = document.getElementById('installModal');
  if (modal) {
    modal.classList.remove('hidden');
    // Use a short timeout to allow the display property to apply before adding the transition class
    setTimeout(() => {
        modal.classList.add('visible');
    }, 10);
  }
}
function hideInstallModal() {
  const modal = document.getElementById('installModal');
  if (modal) {
    modal.classList.remove('visible');
    // Wait for the transition to finish before hiding with display: none
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300); // Should match CSS transition duration
  }
}

// Install PWA
async function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed successfully');
    }
    
    deferredPrompt = null;
    dismissInstallPrompt();
  }
}

// Dismiss install prompt
function dismissInstallPrompt() {
  // Empty since we removed the bottom prompt
  // Modal has its own close handling
}

// Setup iOS audio context
function setupIOSAudioContext() {
  let audioContext;
  
  const initAudioContext = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  };
  
  document.addEventListener('touchstart', initAudioContext, { once: true });
  document.addEventListener('click', initAudioContext, { once: true });
  
  // Handle audio interruptions
  audio.addEventListener('pause', () => {
    if (isIOSDevice && audioContext) {
      audioContext.suspend();
    }
  });
  
  audio.addEventListener('play', () => {
    if (isIOSDevice && audioContext) {
      audioContext.resume();
    }
  });
}

// Setup iOS performance optimizations
function setupIOSPerformanceOptimizations() {
  // Optimize animations for iOS
  const visualizer = document.querySelector('.circle-visualizer');
  if (visualizer) {
    visualizer.style.willChange = 'transform';
  }
  
  // Optimize scroll performance
  document.body.style.webkitOverflowScrolling = 'touch';
  
  // Reduce animations on low-power mode
  if (navigator.userAgent.includes('iPhone')) {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      document.body.classList.add('reduced-motion');
    }
  }
}

// Setup iOS fullscreen
function setupIOSFullscreen() {
  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 500);
  });
  
  // Prevent address bar on iOS Safari
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 0);
  });
}

// Setup background sync
function setupBackgroundSync(registration) {
  // Sync metadata in background
  setInterval(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      registration.sync.register('background-metadata');
    }
  }, 30000);
}

// Show network status
function showNetworkStatus(message, type) {
  const notification = document.createElement('div');
  notification.className = `network-notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? '#4CAF50' : '#FF9800'};
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 10000;
    font-weight: 600;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Show update notification
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; background: rgba(0,0,0,0.9); color: white; padding: 15px; border-radius: 10px; z-index: 10000; display: flex; justify-content: space-between; align-items: center;">
      <span>Nueva versión disponible</span>
      <button onclick="location.reload()" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">Actualizar</button>
    </div>
  `;
  
  document.body.appendChild(notification);
}

// Enhanced metadata fetching with offline support
async function fetchMetadata() {
  try {
    const response = await fetch('https://twj.es/metadata/?url=https://estructuraweb.com.co:9126/live'); // COLOCAR LA URL DE API -----------------------------------------------------------------------------------------------------------------------------------
    const data = await response.json();
    
    // Store in localStorage for offline access
    localStorage.setItem('lastMetadata', JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    updateUI(data);
  } catch (error) {
    console.log('Error fetching metadata:', error);
    
    // Try to use cached data
    const cached = localStorage.getItem('lastMetadata');
    if (cached) {
      const { data } = JSON.parse(cached);
      updateUI(data);
    } else {
      updateUI(null);
    }
  }
}

// Update UI with metadata
function updateUI(data) {
  if (data && data.title && data.title !== '...') {
    const parts = data.title.split(' - ');
    if (parts.length > 1) {
      artistInfo.textContent = parts[0].trim();
      let songTitle = parts.slice(1).join(' - ').trim();
      songInfo.textContent = songTitle.length > 52 ? songTitle.substring(0, 49) + '...' : songTitle;
    } else {
      songInfo.textContent = data.title.length > 52 ? data.title.substring(0, 49) + '...' : data.title;
      artistInfo.textContent = ''; 
    }
    
    if (data.art) {
      loadImage(data.art, function() {
        albumArt.src = data.art;
        backgroundArt.src = data.art;
        albumArt.classList.add('visible');
        backgroundArt.classList.add('visible');
      });
    }
  } else {
    songInfo.textContent = ""; // METADATOS - CANCION ----------------------------------------------------------------------------------
    artistInfo.textContent = ""; //METADATOS - ARTISTA ---------------------------------------------------------------------------------
    albumArt.src = defaultImage;
    backgroundArt.src = defaultImage;
  }
}

// Override original fetchMetadata function
const originalFetchMetadata = window.fetchMetadata;
window.fetchMetadata = fetchMetadata;

// Fetch metadata every 10 seconds
setInterval(fetchMetadata, 10000);
// Initial fetch
fetchMetadata();

// Set initial volume to 100%
audio.volume = 1.0;
volumeSlider.value = 100;
volumePercentage.textContent = '100%';

audio.addEventListener('play', () => {
  isPlaying = true;
  playBtn.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="white">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>`;
});

audio.addEventListener('pause', () => {
  isPlaying = false;
  playBtn.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="white">
    <path d="M8 5v14l11-7z"/>
  </svg>`;
});

// Handle autoplay failure
audio.play().catch(error => {
  console.log("Autoplay prevented:", error);
  isPlaying = false;
  playBtn.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="white">
    <path d="M8 5v14l11-7z"/>
  </svg>`;
});

playBtn.addEventListener('click', () => {
  if (isPlaying) {
    audio.pause();
    playBtn.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="white">
      <path d="M8 5v14l11-7z"/>
    </svg>`;
  } else {
    audio.play();
    playBtn.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="white">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>`;
  }
  isPlaying = !isPlaying;
});

volumeSlider.addEventListener('input', (e) => {
  const value = e.target.value;
  audio.volume = value / 100;
  volumePercentage.textContent = value + '%';
});

// Set default background and album art
albumArt.src = defaultImage;
backgroundArt.src = defaultImage;
albumArt.classList.add('visible');
backgroundArt.classList.add('visible');

// Add menu toggle functionality
const menuBtn = document.getElementById('menuBtn');
const socialMenu = document.getElementById('socialMenu');

menuBtn.addEventListener('click', () => {
  socialMenu.classList.toggle('active');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!menuBtn.contains(e.target) && !socialMenu.contains(e.target)) {
    socialMenu.classList.remove('active');
  }
});

// Image loading optimization
function loadImage(url, callback) {
  const img = new Image();
  img.onload = callback;
  img.src = url;
}

// Load images with proper dimensions (imagen por defecto cuando no haya otra disponible)
const imageUrls = {
  default: 'assets/logo.png'
};

loadImage(imageUrls.default, function() {
  albumArt.src = this.src;
  backgroundArt.src = this.src;
  albumArt.classList.add('visible');
  backgroundArt.classList.add('visible');
});