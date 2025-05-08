/**
 * YouTube Thumbnail Resizer - Complete Shorts Exclusion
 * Completely excludes Shorts from any styling, letting YouTube handle them naturally
 */

// Default settings
let settings = {
    gridColumns: 3,          // Default number of columns
    aspectRatio: 16/9,       // Standard video aspect ratio (width/height)
    margins: 16,             // Margins between thumbnails (px)
    minThumbnailWidth: 200,  // Minimum width for thumbnails
    maxThumbnailWidth: 800   // Maximum width for thumbnails
  };
  
  // Current calculated dimensions
  let calculatedDimensions = {
    width: 320,
    height: 180
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
    
    // Calculate the total space needed for margins between items
    const totalMargins = settings.margins * (settings.gridColumns - 1);
    
    // Calculate thumbnail width based on available space
    let thumbnailWidth = Math.floor((availableWidth - totalMargins) / settings.gridColumns);
    
    // Constrain within min/max bounds
    thumbnailWidth = Math.max(settings.minThumbnailWidth, Math.min(settings.maxThumbnailWidth, thumbnailWidth));
    
    // Calculate height based on aspect ratio
    const thumbnailHeight = Math.floor(thumbnailWidth / settings.aspectRatio);
    
    return {
      width: thumbnailWidth,
      height: thumbnailHeight
    };
  }
  
  // Apply styles based on current settings and calculated dimensions
  function applyStyles() {
    // Calculate dimensions based on current window size
    calculatedDimensions = calculateDimensions();
    
    debugLog('Applying styles with calculated dimensions:', calculatedDimensions);
    
    // Remove existing style element if present
    let styleEl = document.getElementById('yt-thumbnail-resizer-styles');
    if (styleEl) {
      styleEl.remove();
    }
    
    // Create new style element
    styleEl = document.createElement('style');
    styleEl.id = 'yt-thumbnail-resizer-styles';
    
    // Set CSS content - ONLY target standard video grid and skip ALL Shorts-related elements
    styleEl.textContent = `
      /* ONLY TARGET STANDARD VIDEO GRID */
      
      /* Create a grid for the main home feed videos only */
      ytd-rich-grid-renderer:not([is-shorts-grid]) #contents.ytd-rich-grid-renderer > ytd-rich-grid-row:not([is-shorts-grid]),
      ytd-rich-grid-renderer:not([is-shorts-grid]) #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]) {
        display: contents !important;
      }
      
      ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer {
        display: grid !important;
        grid-template-columns: repeat(${settings.gridColumns}, 1fr) !important;
        grid-gap: ${settings.margins}px !important;
        padding: ${settings.margins}px !important;
      }
      
      /* Target standard video items only - ensure narrow selectors */
      ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]):not([class*="shorts"]) {
        grid-column: span 1 !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
      }
      
      /* Size standard video thumbnails only */
      ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]):not([class*="shorts"]) ytd-thumbnail.ytd-rich-grid-media {
        width: 100% !important; 
        height: ${calculatedDimensions.height}px !important;
        overflow: hidden !important;
      }
      
      /* Size thumbnail images for standard videos only */
      ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]):not([class*="shorts"]) ytd-thumbnail img,
      ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]):not([class*="shorts"]) ytd-thumbnail .yt-core-image {
        width: 100% !important;
        height: ${calculatedDimensions.height}px !important;
        object-fit: cover !important;
      }
      
      /* Metadata for standard videos only */
      ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]):not([class*="shorts"]) #meta.ytd-rich-grid-media,
      ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-item-renderer:not([is-short]):not([class*="shorts"]) #video-title.ytd-rich-grid-media {
        width: 100% !important;
        max-width: 100% !important;
      }
      
      /* HANDLE SECTIONS THAT NEED TO TAKE FULL WIDTH */
      
      /* Make sure special section containers take full grid width */
      ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-shelf-renderer,
      ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-horizontal-card-list-renderer,
      ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-horizontal-list-renderer,
      ytd-rich-grid-renderer:not([is-shorts-grid]) > #contents.ytd-rich-grid-renderer > ytd-rich-section-renderer {
        grid-column: 1 / span ${settings.gridColumns} !important;
        width: 100% !important;
        margin: ${settings.margins}px 0 !important;
      }
      
      /* COMPLETELY IGNORE ALL SHORTS-RELATED ELEMENTS */
      /* These selectors will NOT be styled at all */
    `;
    
    // Add style element to document
    document.head.appendChild(styleEl);
    debugLog('Styles applied - Shorts completely excluded');
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
        
        // Send success response with calculated dimensions
        sendResponse({ 
          success: true,
          calculatedDimensions: calculatedDimensions
        });
      } else if (message.command === 'getDimensions') {
        // Send current calculated dimensions
        sendResponse({ 
          calculatedDimensions: calculatedDimensions
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
    debugLog('Initializing YouTube Thumbnail Resizer (Complete Shorts Exclusion)');
    
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
    }, 250); // Only update after resize has stopped for 250ms
  });