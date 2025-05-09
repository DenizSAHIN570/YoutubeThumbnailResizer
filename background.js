/**
 * YouTube Thumbnail Resizer Background Script - Grid-based Version
 */

// Initialize default settings if none exist
function initializeSettings() {
  const defaultSettings = {
    gridColumns: 4,          // Default number of columns
    aspectRatio: 16/9,       // Standard video aspect ratio
    margins: 16,             // Margins between thumbnails (px)
    minThumbnailWidth: 200,  // Minimum width for thumbnails
    maxThumbnailWidth: 500   // Maximum width for thumbnails
  };
  
  // Check if settings already exist
  browser.storage.local.get('thumbnailSettings')
    .then(result => {
      if (!result.thumbnailSettings) {
        // If no settings found, save defaults
        return browser.storage.local.set({ thumbnailSettings: defaultSettings });
      }
    })
    .catch(error => {
      console.error('Error initializing settings:', error);
    });
}

// Run when extension is installed or updated
browser.runtime.onInstalled.addListener(() => {
  console.log('YouTube Thumbnail Resizer installed or updated');
  initializeSettings();
});