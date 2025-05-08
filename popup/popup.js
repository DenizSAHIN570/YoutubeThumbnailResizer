/**
 * YouTube Thumbnail Resizer Popup Script - Grid-based Version
 */

// Default settings
const defaultSettings = {
    gridColumns: 3,          // Default number of columns
    aspectRatio: 16/9,       // Standard video aspect ratio
    margins: 16,             // Margins between thumbnails (px)
    minThumbnailWidth: 200,  // Minimum width for thumbnails
    maxThumbnailWidth: 500   // Maximum width for thumbnails
  };
  
  // DOM elements
  const columnsSlider = document.getElementById('gridColumns');
  const columnsValue = document.getElementById('columnsValue');
  const calculatedWidth = document.getElementById('calculatedWidth');
  const calculatedHeight = document.getElementById('calculatedHeight');
  const saveButton = document.getElementById('saveButton');
  const resetButton = document.getElementById('resetButton');
  const statusMessage = document.getElementById('statusMessage');
  
  // Load current settings from storage
  function loadSettings() {
    try {
      browser.storage.local.get('thumbnailSettings').then((result) => {
        // Use saved settings or defaults
        const settings = result.thumbnailSettings || defaultSettings;
        
        // Update slider and displayed value
        columnsSlider.value = settings.gridColumns;
        columnsValue.textContent = settings.gridColumns;
        
        // Get current dimensions from active YouTube tab
        getCurrentDimensions();
      }).catch(error => {
        console.error('Error loading settings:', error);
        // Fall back to defaults
        useDefaultSettings();
      });
    } catch (error) {
      console.error('Error accessing browser API:', error);
      // Fall back to defaults
      useDefaultSettings();
    }
  }
  
  // Use default settings
  function useDefaultSettings() {
    columnsSlider.value = defaultSettings.gridColumns;
    columnsValue.textContent = defaultSettings.gridColumns;
    
    // Use placeholder dimensions
    calculatedWidth.textContent = '320';
    calculatedHeight.textContent = '180';
  }
  
  // Get current dimensions from active YouTube tab
  function getCurrentDimensions() {
    try {
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0] && tabs[0].url.includes('youtube.com')) {
          browser.tabs.sendMessage(tabs[0].id, {
            command: 'getDimensions'
          }).then(response => {
            if (response && response.calculatedDimensions) {
              updateDimensionDisplay(response.calculatedDimensions);
            }
          }).catch(error => {
            console.error('Error getting dimensions:', error);
            // Keep default dimensions display
          });
        }
      });
    } catch (error) {
      console.error('Error accessing tabs API:', error);
    }
  }
  
  // Update displayed dimensions
  function updateDimensionDisplay(dimensions) {
    if (dimensions && dimensions.width && dimensions.height) {
      calculatedWidth.textContent = dimensions.width;
      calculatedHeight.textContent = dimensions.height;
    }
  }
  
  // Update displayed values when slider changes
  columnsSlider.addEventListener('input', () => {
    columnsValue.textContent = columnsSlider.value;
  });
  
  // Save settings
  saveButton.addEventListener('click', () => {
    // Show "saving" message immediately
    showStatus('Applying layout...', false);
    
    const settings = {
      gridColumns: parseInt(columnsSlider.value, 10),
      // Keep other settings as they were, only updating columns
      aspectRatio: 16/9,
      margins: 16,
      minThumbnailWidth: 200,
      maxThumbnailWidth: 500
    };
    
    // Save to storage
    try {
      browser.storage.local.set({ thumbnailSettings: settings }).then(() => {
        // Send message to content script to update
        sendSettingsToActiveTab(settings);
      }).catch(error => {
        console.error('Error saving settings:', error);
        showStatus('Error applying layout. Try again.', true);
      });
    } catch (error) {
      console.error('Error accessing browser API:', error);
      showStatus('Error accessing browser API. Please try again.', true);
    }
  });
  
  // Reset settings
  resetButton.addEventListener('click', () => {
    // Update UI
    columnsSlider.value = defaultSettings.gridColumns;
    columnsValue.textContent = defaultSettings.gridColumns;
    
    // Show message
    showStatus('Resetting to default layout...', false);
    
    // Save default settings
    try {
      browser.storage.local.set({ thumbnailSettings: defaultSettings }).then(() => {
        // Send message to content script to update
        sendSettingsToActiveTab(defaultSettings);
      }).catch(error => {
        console.error('Error resetting settings:', error);
        showStatus('Error resetting layout. Try again.', true);
      });
    } catch (error) {
      console.error('Error accessing browser API:', error);
      showStatus('Error accessing browser API. Please try again.', true);
    }
  });
  
  // Send settings to the active tab
  function sendSettingsToActiveTab(settings) {
    try {
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0] && tabs[0].url.includes('youtube.com')) {
          browser.tabs.sendMessage(tabs[0].id, {
            command: 'updateSettings',
            settings: settings
          }).then(response => {
            if (response && response.success) {
              showStatus('Layout applied successfully!', false);
              
              // Update dimensions display if provided
              if (response.calculatedDimensions) {
                updateDimensionDisplay(response.calculatedDimensions);
              }
            } else {
              showStatus('Settings saved! Refresh if needed.', false);
            }
          }).catch(error => {
            console.error('Error sending message to tab:', error);
            showStatus('Layout saved! Please refresh YouTube.', false);
          });
        } else {
          showStatus('Layout saved! Open YouTube to see changes.', false);
        }
      }).catch(error => {
        console.error('Error querying tabs:', error);
        showStatus('Layout saved! Please refresh YouTube.', false);
      });
    } catch (error) {
      console.error('Error accessing browser API:', error);
      showStatus('Settings saved, but couldn\'t apply automatically.', true);
    }
  }
  
  // Show status message
  function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? '#c00' : '#007700';
    
    // Clear message after a delay (only if it's a success message)
    if (!isError) {
      setTimeout(() => {
        if (statusMessage.textContent === message) {
          statusMessage.textContent = '';
        }
      }, 5000);
    }
  }
  
  // Initialize popup
  document.addEventListener('DOMContentLoaded', loadSettings);