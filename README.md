# YouTube Thumbnail Resizer Firefox Addon

A Firefox extension that lets you customize YouTube's homepage layout by adjusting the number of video columns in the grid.

![YouTube Grid Customizer Screenshot](icons/icon-48.png)

## Features

- Customize the number of video columns (1-8) on YouTube's homepage
- Responsive design that automatically adjusts thumbnail sizes based on window width
- Maintains proper aspect ratio for videos
- Preserves YouTube's Shorts section in its original format
- Clean, minimal interface

## Installation

### From Firefox Add-ons (Recommended)
1. Visit [Firefox Add-ons Page](#) *(Add link when published)*
2. Click "Add to Firefox"

### Manual Installation (Temporary)
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the extension directory and select `manifest.json`

## Usage

1. Navigate to YouTube's homepage
2. Click the extension icon in the Firefox toolbar
3. Adjust the column slider to your preferred number of columns (1-8)
4. Click "Apply Layout" to see the changes
5. The extension will remember your settings between browser sessions

## How It Works

The extension uses CSS Grid to modify YouTube's layout, allowing for a customizable number of columns while maintaining proper spacing and thumbnail sizes. It carefully targets only the main video grid without affecting special content like Shorts.

## Development

### Project Structure
```
youtube-grid-customizer/
├── manifest.json           # Extension configuration
├── icons/                  # Extension icons
│   ├── icon-48.png
│   └── icon-96.png
├── popup/                  # User interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content_scripts/        # YouTube page modifications
│   └── thumbnailResizer.js
└── background.js           # Background script
```

### Building from Source
1. Clone the repository
2. Make any desired changes
3. Test using Firefox's about:debugging page
4. Package using web-ext: `web-ext build`

## Compatibility

- Works with Firefox 78 and newer
- Tested with YouTube's layout as of May 2025
- Automatically adapts to most YouTube layout changes

## Known Issues

- On some YouTube layout updates, a page refresh may be necessary to apply changes
- The extension only affects the main YouTube homepage and video browsing pages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Created for personal use and shared with the community
- Inspired by the need for a more customizable YouTube browsing experience
