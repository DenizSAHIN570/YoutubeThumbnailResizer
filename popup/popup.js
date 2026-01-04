/**
 * YouTube Thumbnail Resizer Popup Script - Theme-Aware Version with Shorts Control
 */

// Default settings
const defaultSettings = {
  gridColumns: 4,
  aspectRatio: 16/9,
  margins: 16,
  minThumbnailWidth: 200,
  maxThumbnailWidth: 500,
  darkTheme: false,
  hideShorts: false
};

// DOM elements
const columnsSlider = document.getElementById('gridColumns');
const columnsValue = document.getElementById('columnsValue');
const calculatedWidth = document.getElementById('calculatedWidth');
const calculatedHeight = document.getElementById('calculatedHeight');
const effectiveColumnsInfo = document.getElementById('effectiveColumnsInfo');
const rangeConstraintsInfo = document.getElementById('rangeConstraintsInfo');
const saveButton = document.getElementById('saveButton');
const resetButton = document.getElementById('resetButton');
const statusMessage = document.getElementById('statusMessage');
const themeToggle = document.getElementById('themeToggle');
const hideShortsToggle = document.getElementById('hideShortsToggle');

// Store the determined range constraints
let currentRangeConstraints = {
  min: 1,
  max: 8,
  current: 4
};

// Load current settings from storage
function loadSettings() {
  try {
    browser.storage.local.get(['thumbnailSettings', 'themeSettings']).then((result) => {
      // Load thumbnail settings
      const settings = result.thumbnailSettings || defaultSettings;
      
      // Load theme settings
      const themeSettings = result.themeSettings || { darkTheme: false };
      
      // Apply theme
      applyTheme(themeSettings.darkTheme);
      themeToggle.checked = themeSettings.darkTheme;
      
      // Apply Shorts visibility setting
      hideShortsToggle.checked = settings.hideShorts || false;
      
      // Get screen constraints, then apply saved value if valid
      getCurrentScreenConstraints(settings.gridColumns);
    }).catch(error => {
      console.error('Error loading settings:', error);
      useDefaultSettings();
    });
  } catch (error) {
    console.error('Error accessing browser API:', error);
    useDefaultSettings();
  }
}

// Apply theme based on preference
function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

// Save theme settings
function saveThemeSettings(isDark) {
  try {
    browser.storage.local.set({ themeSettings: { darkTheme: isDark } }).then(() => {
      console.log('Theme settings saved');
    }).catch(error => {
      console.error('Error saving theme settings:', error);
    });
  } catch (error) {
    console.error('Error accessing browser API:', error);
  }
}

// Use default settings
function useDefaultSettings() {
  columnsSlider.value = defaultSettings.gridColumns;
  columnsValue.textContent = defaultSettings.gridColumns;
  hideShortsToggle.checked = defaultSettings.hideShorts;
  
  calculatedWidth.textContent = '320';
  calculatedHeight.textContent = '180';
  effectiveColumnsInfo.textContent = '';
  rangeConstraintsInfo.textContent = 'Range: 1-8 columns';
  
  // Apply default theme
  applyTheme(defaultSettings.darkTheme);
  themeToggle.checked = defaultSettings.darkTheme;
}

// Get constraints based on current screen size
function getCurrentScreenConstraints(savedColumnValue) {
  try {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0] && tabs[0].url.includes('youtube.com')) {
        browser.tabs.sendMessage(tabs[0].id, {
          command: 'getScreenConstraints'
        }).then(response => {
          if (response && response.constraints) {
            updateSliderConstraints(response.constraints, savedColumnValue);
            getCurrentDimensions();
          } else {
            applyDefaultConstraints(savedColumnValue);
            getCurrentDimensions();
          }
        }).catch(error => {
          console.error('Error getting screen constraints:', error);
          applyDefaultConstraints(savedColumnValue);
          getCurrentDimensions();
        });
      } else {
        applyDefaultConstraints(savedColumnValue);
      }
    });
  } catch (error) {
    console.error('Error accessing tabs API:', error);
    applyDefaultConstraints(savedColumnValue);
  }
}

// Apply default constraints if we can't get dynamic ones
function applyDefaultConstraints(savedColumnValue) {
  currentRangeConstraints = {
    min: 3,
    max: 8,
    current: savedColumnValue || 4
  };
  
  updateSliderWithCurrentConstraints();
}

// Update slider based on determined constraints
function updateSliderConstraints(constraints, savedColumnValue) {
  currentRangeConstraints = constraints;
  
  // Apply saved setting if valid, otherwise use recommended value
  if (savedColumnValue) {
    currentRangeConstraints.current = Math.min(
      Math.max(savedColumnValue, constraints.min), 
      constraints.max
    );
  }
  
  updateSliderWithCurrentConstraints();
}

// Apply the current constraints to the slider UI
function updateSliderWithCurrentConstraints() {
  // Update slider attributes
  columnsSlider.min = currentRangeConstraints.min;
  columnsSlider.max = currentRangeConstraints.max;
  columnsSlider.value = currentRangeConstraints.current;
  
  // Update displayed value
  columnsValue.textContent = currentRangeConstraints.current;
  
  // Show range info
  rangeConstraintsInfo.textContent = `Available range: ${currentRangeConstraints.min}-${currentRangeConstraints.max} columns`;
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
            
            // Also update constraints if provided
            if (response.constraints) {
              updateSliderConstraints(response.constraints, parseInt(columnsSlider.value, 10));
            }
          }
        }).catch(error => {
          console.error('Error getting dimensions:', error);
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
    
    // Show effective columns if it differs from the setting
    if (dimensions.effectiveColumns && 
        parseInt(columnsSlider.value, 10) !== dimensions.effectiveColumns) {
      effectiveColumnsInfo.textContent = 
        `(Adjusted to ${dimensions.effectiveColumns} columns)`;
    } else {
      effectiveColumnsInfo.textContent = '';
    }
  }
}

// Update displayed values when slider changes
columnsSlider.addEventListener('input', () => {
  columnsValue.textContent = columnsSlider.value;
});

// Toggle theme when switch is clicked
themeToggle.addEventListener('change', () => {
  const isDarkTheme = themeToggle.checked;
  applyTheme(isDarkTheme);
  saveThemeSettings(isDarkTheme);
});

// Toggle Shorts visibility and apply immediately
hideShortsToggle.addEventListener('change', () => {
  const settings = {
    gridColumns: parseInt(columnsSlider.value, 10),
    aspectRatio: 16/9,
    margins: 16,
    minThumbnailWidth: 200,
    maxThumbnailWidth: 500,
    hideShorts: hideShortsToggle.checked
  };
  
  showStatus(hideShortsToggle.checked ? 'Hiding Shorts...' : 'Showing Shorts...', false);
  
  try {
    browser.storage.local.set({ thumbnailSettings: settings }).then(() => {
      sendSettingsToActiveTab(settings);
    }).catch(error => {
      console.error('Error saving settings:', error);
      showStatus('Error applying setting. Try again.', true);
    });
  } catch (error) {
    console.error('Error accessing browser API:', error);
    showStatus('Error accessing browser API. Please try again.', true);
  }
});

// Save settings
saveButton.addEventListener('click', () => {
  showStatus('Applying layout...', false);
  
  const settings = {
    gridColumns: parseInt(columnsSlider.value, 10),
    aspectRatio: 16/9,
    margins: 16,
    minThumbnailWidth: 200,
    maxThumbnailWidth: 500,
    hideShorts: hideShortsToggle.checked
  };
  
  try {
    browser.storage.local.set({ thumbnailSettings: settings }).then(() => {
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
  // Use recommended column count from current valid range
  const newDefault = {
    ...defaultSettings,
    gridColumns: currentRangeConstraints.recommended || 
                Math.floor((currentRangeConstraints.min + currentRangeConstraints.max) / 2)
  };
  
  columnsSlider.value = newDefault.gridColumns;
  columnsValue.textContent = newDefault.gridColumns;
  hideShortsToggle.checked = newDefault.hideShorts;
  
  showStatus('Resetting to optimal layout...', false);
  
  try {
    browser.storage.local.set({ thumbnailSettings: newDefault }).then(() => {
      sendSettingsToActiveTab(newDefault);
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
            
            if (response.calculatedDimensions) {
              updateDimensionDisplay(response.calculatedDimensions);
              
              if (response.constraints) {
                updateSliderConstraints(response.constraints, settings.gridColumns);
              }
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
  statusMessage.style.color = isError ? '#c00' : '';
  
  if (!isError) {
    setTimeout(() => {
      if (statusMessage.textContent === message) {
        statusMessage.textContent = '';
      }
    }, 5000);
  }
}

// Listen for dimension updates from content script
browser.runtime.onMessage.addListener((message) => {
  if (message.command === 'dimensionsChanged') {
    if (message.calculatedDimensions) {
      updateDimensionDisplay(message.calculatedDimensions);
    }
    
    if (message.constraints) {
      updateSliderConstraints(message.constraints, parseInt(columnsSlider.value, 10));
    }
  }
  return true;
});

// Initialize popup
document.addEventListener('DOMContentLoaded', loadSettings);

// Check system preference for initial load
function checkSystemThemePreference() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  return false;
}

// Apply system preference if no saved setting exists
function initializeTheme() {
  browser.storage.local.get('themeSettings').then((result) => {
    if (!result.themeSettings) {
      const prefersDark = checkSystemThemePreference();
      applyTheme(prefersDark);
      themeToggle.checked = prefersDark;
      saveThemeSettings(prefersDark);
    }
  }).catch(() => {
    // If error, use system preference
    const prefersDark = checkSystemThemePreference();
    applyTheme(prefersDark);
    themeToggle.checked = prefersDark;
  });
}

// Initialize theme based on system or saved preference
initializeTheme();