/**
 * YouTube Thumbnail Resizer - With Shorts Support
 * Handles both standard videos and Shorts with appropriate aspect ratios
 */

// Default settings
let settings = {
  gridColumns: 4,          // Default number of columns
  aspectRatio: 16/9,       // Standard video aspect ratio (width/height)
  shortsAspectRatio: 9/16, // Shorts aspect ratio (vertical)
  margins: 16,             // Margins between thumbnails (px)
  minThumbnailWidth: 200,  // Minimum width for thumbnails
  maxThumbnailWidth: 800,  // Maximum width for thumbnails
  hideShorts: false        // Hide Shorts sections entirely
};

// Current calculated dimensions
let calculatedDimensions = {
  width: 320,
  height: 180,
  shortsWidth: 180,
  shortsHeight: 320,
  effectiveColumns: 4
};

// Create a debug function that logs to console
function debugLog(message, data) {
  console.log(`[YouTube Resizer] ${message}`, data || '');
}

// Calculate thumbnail dimensions based on window size and grid settings
function calculateDimensions() {
  // Get the main content area width
  const contentArea = document.querySelector('#primary') || document;
  let availableWidth = contentArea.clientWidth || window.innerWidth;
  
  // Account for main page padding (estimate)
  availableWidth -= 48;
  
  // Calculate effective column count based on screen constraints
  let effectiveColumns = settings.gridColumns;
  
  // Calculate width per column for the desired column count
  const totalMarginsForDesired = settings.margins * (effectiveColumns - 1);
  const widthPerColumnDesired = (availableWidth - totalMarginsForDesired) / effectiveColumns;
  
  // If width per column is too small or too large, adjust column count
  if (widthPerColumnDesired < settings.minThumbnailWidth) {
    const maxColumns = Math.floor((availableWidth + settings.margins) / (settings.minThumbnailWidth + settings.margins));
    effectiveColumns = Math.max(1, maxColumns);
    debugLog(`Adjusting down to ${effectiveColumns} columns due to minimum width constraint`);
  } else if (widthPerColumnDesired > settings.maxThumbnailWidth) {
    const minColumns = Math.ceil((availableWidth + settings.margins) / (settings.maxThumbnailWidth + settings.margins));
    effectiveColumns = Math.max(settings.gridColumns, minColumns);
    debugLog(`Adjusting up to ${effectiveColumns} columns due to maximum width constraint`);
  }
  
  // Calculate the total space needed for margins between items with adjusted columns
  const totalMargins = settings.margins * (effectiveColumns - 1);
  
  // Calculate thumbnail width based on available space
  let thumbnailWidth = Math.floor((availableWidth - totalMargins) / effectiveColumns);
  
  // Constrain within min/max bounds (safeguard)
  thumbnailWidth = Math.max(settings.minThumbnailWidth, Math.min(settings.maxThumbnailWidth, thumbnailWidth));
  
  // Important: Ensure width is an integer to prevent rounding inconsistencies
  thumbnailWidth = Math.floor(thumbnailWidth);
  
  // Calculate height based on aspect ratio - ensure integer value
  const thumbnailHeight = Math.floor(thumbnailWidth / settings.aspectRatio);
  
  // Calculate Shorts dimensions (vertical aspect ratio)
  // Use regular video width as base, then calculate height to maintain 9:16 ratio
  const shortsWidth = Math.floor(thumbnailWidth * 0.6); // Make Shorts 60% of regular video width
  const shortsHeight = Math.floor(shortsWidth * (16/9)); // Height is width * (16/9) for 9:16 vertical aspect
  
  return {
    width: thumbnailWidth,
    height: thumbnailHeight,
    shortsWidth: shortsWidth,
    shortsHeight: shortsHeight,
    effectiveColumns: effectiveColumns
  };
}

// Store the last calculated screen constraints to ensure consistency
let lastCalculatedConstraints = null;

function calculateScreenConstraints() {
  // Get the exact same dimensions as calculateDimensions
  const contentArea = document.querySelector('#primary') || document;
  let availableWidth = contentArea.clientWidth || window.innerWidth;
  availableWidth -= 48;
  
  // Use the exact same formula as in calculateDimensions
  const maxColumns = Math.floor((availableWidth + settings.margins) / (settings.minThumbnailWidth + settings.margins));
  const minColumns = Math.max(1, Math.ceil((availableWidth + settings.margins) / (settings.maxThumbnailWidth + settings.margins)));
  
  // Use the current effective columns to determine recommendation
  const currentEffectiveColumns = calculatedDimensions.effectiveColumns;
  
  // Create constraints object
  const constraints = {
    min: minColumns,
    max: maxColumns,
    recommended: Math.min(Math.max(Math.round((minColumns + maxColumns) / 2), minColumns), maxColumns),
    screenWidth: availableWidth,
    effectiveColumns: currentEffectiveColumns
  };
  
  // Verify that effective columns is within constraints
  if (currentEffectiveColumns < minColumns || currentEffectiveColumns > maxColumns) {
    debugLog('Warning: Effective columns outside calculated constraints', {
      effectiveColumns: currentEffectiveColumns,
      constraints: constraints
    });
  }
  
  // Cache for later use
  lastCalculatedConstraints = constraints;
  
  return constraints;
}

function notifyPopupOfChanges() {
  // Only proceed if the popup might be open (no way to check directly)
  try {
    browser.runtime.sendMessage({
      command: 'dimensionsChanged',
      calculatedDimensions: calculatedDimensions,
      constraints: lastCalculatedConstraints || calculateScreenConstraints()
    }).catch(() => {
      // Ignore errors - popup is likely just closed
    });
  } catch (e) {
    // Ignore any errors
  }
}

// Apply styles based on current settings and calculated dimensions
function applyStyles() {
  // Calculate dimensions based on current window size
  calculatedDimensions = calculateDimensions();
  
  // Update cached constraints with new effective columns
  if (lastCalculatedConstraints) {
    lastCalculatedConstraints.effectiveColumns = calculatedDimensions.effectiveColumns;
  }
  
  debugLog('Applying styles with calculated dimensions:', calculatedDimensions);
  debugLog(`Using ${calculatedDimensions.effectiveColumns} columns (user setting: ${settings.gridColumns})`);
  
  // Remove existing style element if present
  let styleEl = document.getElementById('yt-thumbnail-resizer-styles');
  if (styleEl) {
    styleEl.remove();
  }
  
  // Create new style element
  styleEl = document.createElement('style');
  styleEl.id = 'yt-thumbnail-resizer-styles';
  
  // Set CSS content - Handle both standard videos and Shorts
  styleEl.textContent = `
    /* ========================================
       STANDARD VIDEO GRID
       ======================================== */
    
    /* Create a grid for the main home feed videos */
    ytd-rich-grid-renderer:not([is-shorts-grid]) #contents.ytd-rich-grid-renderer > ytd-rich-grid-row:not([is-shorts-grid]),
    ytd-rich-grid-renderer:not([is-shorts-grid]) #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer {
      display: contents !important;
    }
    
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer {
      display: grid !important;
      grid-template-columns: repeat(${calculatedDimensions.effectiveColumns}, ${calculatedDimensions.width}px) !important;
      grid-gap: ${settings.margins}px !important;
      padding: ${settings.margins}px !important;
      justify-content: center !important;
    }
    
    /* Target standard video items only */
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]) {
      grid-column: span 1 !important;
      width: ${calculatedDimensions.width}px !important;
      max-width: ${calculatedDimensions.width}px !important;
      min-width: ${calculatedDimensions.width}px !important;
      margin: 0 !important;
    }
    
    /* Size standard video thumbnails */
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]) ytd-thumbnail.ytd-rich-grid-media {
      width: ${calculatedDimensions.width}px !important; 
      height: ${calculatedDimensions.height}px !important;
      overflow: hidden !important;
    }
    
    /* Size thumbnail images for standard videos */
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]) ytd-thumbnail img,
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]) ytd-thumbnail .yt-core-image {
      width: ${calculatedDimensions.width}px !important;
      height: ${calculatedDimensions.height}px !important;
      object-fit: cover !important;
    }
    
    /* Metadata for standard videos */
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]) #meta.ytd-rich-grid-media,
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]) #video-title.ytd-rich-grid-media {
      width: ${calculatedDimensions.width}px !important;
      max-width: ${calculatedDimensions.width}px !important;
    }
    
    /* ========================================
       SHORTS SUPPORT (Rich Shelf Container)
       ======================================== */
    
    ${settings.hideShorts ? `
    /* Hide Shorts entirely if setting is enabled */
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-shelf-renderer,
    ytd-rich-shelf-renderer {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      overflow: hidden !important;
    }
    ` : `
    /* Make Shorts shelf take full width */
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-shelf-renderer {
      grid-column: 1 / span ${calculatedDimensions.effectiveColumns} !important;
      width: 100% !important;
      margin: ${settings.margins}px 0 !important;
    }
    
    /* Shorts container inside shelf - make it a grid */
    ytd-rich-shelf-renderer #contents.ytd-rich-shelf-renderer {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, ${calculatedDimensions.shortsWidth}px) !important;
      grid-gap: ${settings.margins}px !important;
      justify-content: start !important;
    }
    
    /* Individual Shorts items in shelf */
    ytd-rich-shelf-renderer ytd-rich-item-renderer {
      width: ${calculatedDimensions.shortsWidth}px !important;
      max-width: ${calculatedDimensions.shortsWidth}px !important;
      min-width: ${calculatedDimensions.shortsWidth}px !important;
      margin: 0 !important;
    }
    
    /* Shorts thumbnail container - reset and rebuild */
    ytd-rich-shelf-renderer ytm-shorts-lockup-view-model .shortsLockupViewModelHostThumbnailParentContainer {
      all: unset !important;
      display: block !important;
      width: ${calculatedDimensions.shortsWidth}px !important;
      height: ${calculatedDimensions.shortsHeight}px !important;
      overflow: hidden !important;
      background: #000 !important;
      border-radius: 8px !important;
    }
    
    /* Shorts thumbnail view model - complete reset */
    ytd-rich-shelf-renderer yt-thumbnail-view-model {
      all: unset !important;
      display: block !important;
      width: ${calculatedDimensions.shortsWidth}px !important;
      height: ${calculatedDimensions.shortsHeight}px !important;
    }
    
    /* Shorts thumbnail images wrapper - complete reset */
    ytd-rich-shelf-renderer yt-thumbnail-view-model .ytThumbnailViewModelImage {
      all: unset !important;
      display: block !important;
      width: ${calculatedDimensions.shortsWidth}px !important;
      height: ${calculatedDimensions.shortsHeight}px !important;
    }
    
    /* All Shorts images - strip YouTube classes and apply our own */
    ytd-rich-shelf-renderer yt-thumbnail-view-model img,
    ytd-rich-shelf-renderer yt-thumbnail-view-model .ytThumbnailViewModelImage img,
    ytd-rich-shelf-renderer img.ytCoreImageHost,
    ytd-rich-shelf-renderer img[class*="ytCoreImage"] {
      all: unset !important;
      display: block !important;
      width: ${calculatedDimensions.shortsWidth}px !important;
      height: ${calculatedDimensions.shortsHeight}px !important;
      max-width: ${calculatedDimensions.shortsWidth}px !important;
      max-height: ${calculatedDimensions.shortsHeight}px !important;
      min-width: ${calculatedDimensions.shortsWidth}px !important;
      min-height: ${calculatedDimensions.shortsHeight}px !important;
      object-fit: cover !important;
      object-position: center !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Shorts metadata */
    ytd-rich-shelf-renderer .shortsLockupViewModelHostOutsideMetadata {
      width: ${calculatedDimensions.shortsWidth}px !important;
      max-width: ${calculatedDimensions.shortsWidth}px !important;
    }
    `}
    
    /* ========================================
       FULL-WIDTH SECTIONS
       ======================================== */
    
    /* Make sure special section containers take full grid width */
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-shelf-renderer:not([is-shorts]),
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-horizontal-card-list-renderer,
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-horizontal-list-renderer,
    ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-section-renderer {
      grid-column: 1 / span ${calculatedDimensions.effectiveColumns} !important;
      width: 100% !important;
      margin: ${settings.margins}px 0 !important;
    }
  `;
  
  // Add style element to document
  document.head.appendChild(styleEl);
  debugLog('Styles applied - Shorts ' + (settings.hideShorts ? 'hidden' : 'visible'));
}

// Load settings from storage
function loadSettings() {
  debugLog('Loading settings from storage');
  
  // Try to get settings from local storage
  browser.storage.local.get('thumbnailSettings')
    .then(result => {
      if (result.thumbnailSettings) {
        settings = { ...settings, ...result.thumbnailSettings };
        debugLog('Loaded settings from storage:', settings);
      } else {
        debugLog('No saved settings found, using defaults');
      }
      
      // Apply the styles with whatever settings we have
      applyStyles();
    })
    .catch(error => {
      debugLog('Error loading settings, using defaults:', error);
      // Continue with default settings if there's an error
      applyStyles();
    });
}

// Set up message listener for settings updates
function setupMessageListener() {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    debugLog('Received message:', message);
    
    if (message.command === 'updateSettings') {
      // Update settings
      settings = { ...settings, ...message.settings };
      debugLog('Updated settings:', settings);
      
      // Apply new styles
      applyStyles();
      
      // Get current screen constraints
      const constraints = calculateScreenConstraints();
      
      // Send success response with calculated dimensions and constraints
      sendResponse({ 
        success: true,
        calculatedDimensions: calculatedDimensions,
        constraints: constraints
      });
    } else if (message.command === 'getDimensions') {
      // Ensure constraints are calculated if needed
      if (!lastCalculatedConstraints) {
        calculateScreenConstraints();
      }
      
      // Send current calculated dimensions with constraints
      sendResponse({ 
        calculatedDimensions: calculatedDimensions,
        constraints: lastCalculatedConstraints
      });
    } else if (message.command === 'getScreenConstraints') {
      // Calculate and return the available column range for this screen
      const constraints = calculateScreenConstraints();
      sendResponse({ 
        constraints: constraints
      });
    }
    
    // Required for async sendResponse
    return true;
  });
}

// Apply styles when YouTube's content changes
function setupContentObserver() {
  // Function to handle YouTube content updates
  function handleContentChanges() {
    // Add a delay to ensure all elements are loaded
    setTimeout(applyStyles, 500);
  }

  // Observer for page content changes
  const contentObserver = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          // Look for video-related elements being added
          if (node.nodeName && 
              (node.nodeName.includes('YTD-') || 
               node.classList && node.classList.contains('ytd-'))) {
            shouldUpdate = true;
            break;
          }
        }
      }
      
      if (shouldUpdate) break;
    }
    
    if (shouldUpdate) {
      handleContentChanges();
    }
  });
  
  // Start observing with appropriate options
  contentObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false
  });
  
  // Also listen for YouTube's navigation events
  window.addEventListener('yt-navigate-finish', handleContentChanges);
  window.addEventListener('yt-page-data-updated', handleContentChanges);
  
  debugLog('Content observer set up');
}

// Initialize everything
function initialize() {
  debugLog('Initializing YouTube Thumbnail Resizer (with Shorts Support)');
  
  // Load settings first
  loadSettings();
  
  // Set up message listener
  setupMessageListener();
  
  // Set up observer for content changes
  setupContentObserver();
  
  // Apply styles on initial load
  applyStyles();
  
  // Apply again after a delay to catch all elements
  setTimeout(applyStyles, 2000);
}

// Start everything when the content script loads
initialize();

// Apply styles on window resize to adjust grid
window.addEventListener('resize', () => {
  // Use debounce pattern to avoid excessive calculations during resize
  if (window.ytResizerResizeTimer) {
    clearTimeout(window.ytResizerResizeTimer);
  }
  
  window.ytResizerResizeTimer = setTimeout(() => {
    applyStyles();
    notifyPopupOfChanges();
  }, 250); // Only update after resize has stopped for 250ms
});