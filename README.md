# 🛡️ Smart Link Cleaner

A privacy-focused browser extension that automatically removes tracking parameters and follows redirect chains to give you clean, direct URLs.

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Testing](#testing)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Current

- **🧹 Automatic Tracking Parameter Removal**: Strips 20+ common tracking parameters including:
  - Google Analytics (`utm_*`, `gclid`)
  - Facebook (`fbclid`)
  - Microsoft/Bing (`msclkid`)
  - Email marketing (`mc_cid`, `_hsenc`)
  - And many more

- **🔗 Redirect Chain Following**: Automatically traces URL shorteners and redirect chains to find the final destination
  - Follows up to 10 redirects
  - 5-second timeout for safety
  - Graceful fallback on CORS errors

- **📊 Usage Statistics**: Track your privacy improvements
  - Total links processed
  - Redirects followed
  - Tracking parameters removed
  - Average processing time

- **🎯 Smart Link Interception**: Works with all click types
  - Normal clicks
  - Ctrl/Cmd + Click (new tab)
  - Middle mouse button
  - Context menu "Open in new tab"

- **⚡ Background Processing**: Non-blocking architecture that processes URLs without freezing your browser

## 🚀 Installation

### For Development (Chromium Browsers)

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd link-cleaner-extension
   ```

2. **Open your browser's extension page**
   - Chrome: `chrome://extensions/`
   - Brave: `brave://extensions/`
   - Edge: `edge://extensions/`

3. **Enable Developer Mode**
   - Toggle the switch in the top-right corner

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `link-cleaner-extension` folder
   - The extension should now appear in your extensions list

5. **Verify installation**
   - Look for the extension icon in your toolbar
   - Click it to see the statistics popup

## 🔧 How It Works

### Architecture

```
User clicks link
    ↓
Content Script (content.js) intercepts click
    ↓
Sends URL to Background Service Worker (background.js)
    ↓
    ├─→ [Step 1] Trace Redirects
    │   • Follow HTTP 3xx redirects
    │   • Handle URL shorteners
    │   • Timeout after 5 seconds
    │   • Fallback on CORS errors
    ↓
    ├─→ [Step 2] Clean Tracking Parameters
    │   • Parse URL query string
    │   • Remove known tracking params
    │   • Preserve functional parameters
    ↓
Final clean URL returned to Content Script
    ↓
Browser navigates to clean URL
```

### Key Components

- **manifest.json**: Extension configuration and permissions
- **background.js**: Main processing logic (service worker)
- **content.js**: Link click interception on web pages
- **popup.html/js**: Statistics dashboard UI
- **icons/**: Extension icons (16x16, 48x48, 128x128)

## 📁 Project Structure

```
link-cleaner-extension/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker (main logic)
├── content.js            # Content script (link interception)
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic and statistics
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── test-links.html       # Test page for development
├── README.md             # This file
└── SETUP.md              # Detailed setup instructions
```

## 💻 Usage

### Basic Usage

Once installed, the extension works automatically:

1. **Browse normally** - Click any link as usual
2. **Watch it work** - Brief processing delay (1-5 seconds)
3. **Arrive at clean URL** - Tracking parameters removed, redirects followed

### View Statistics

Click the extension icon to see:
- Total links processed
- Redirects followed
- Trackers removed
- Average processing time

### Enable/Disable

Toggle the extension on/off from the popup interface.

### Reset Statistics

Click "Reset Statistics" in the popup to clear all tracking data.

## 🧪 Testing

### Quick Test

1. Open `test-links.html` in your browser
2. Click through the test scenarios
3. Verify URLs in address bar are cleaned
4. Check console for processing logs (F12)

### Manual Testing

Test with real-world links:
- Google search results (lots of `utm_*` parameters)
- Facebook shared links (`fbclid`)
- Amazon product links (`ref`, `tag`)
- URL shorteners (bit.ly, tinyurl.com)

### Debugging

**View Content Script Logs:**
- Press F12 on any webpage
- Check Console tab
- Look for "Smart Link Cleaner: Content script loaded"

**View Background Script Logs:**
- Go to `chrome://extensions/` (or `brave://extensions/`)
- Find Smart Link Cleaner
- Click "service worker" link
- Check console output

## ⚠️ Known Limitations

### Current MVP Limitations

1. **CORS Restrictions**: Many sites block cross-origin HEAD requests, preventing redirect tracing
   - **Workaround**: Extension falls back to original URL
   - **Future**: Will add CORS proxy option

2. **JavaScript Redirects**: Only detects HTTP 3xx redirects, not JS-based redirects
   - **Example**: `window.location = ...` not detected
   - **Future**: Will add JS redirect detection

3. **Processing Latency**: Adds 1-5 seconds to navigation time
   - **Cause**: Network requests to trace redirects
   - **Future**: Will add caching and performance optimizations

4. **Limited Tracking Parameter List**: Currently removes ~20 common parameters
   - **Future**: Will expand to 100+ parameters

5. **No VirusTotal Integration**: Security checking not yet implemented
   - **Status**: Planned for next release

## 🗺️ Roadmap

### Short Term

- [ ] Visual loading indicators during processing
- [ ] Toast notifications for actions taken
- [ ] Expanded tracking parameter list (100+)
- [ ] Whitelist/trusted domains feature
- [ ] Better CORS error handling
- [ ] Settings page
- [ ] Context menu integration
- [ ] Redirect result caching

### Medium Term

- [ ] VirusTotal integration for security scanning
- [ ] Better statistics dashboard with graphs
- [ ] Export data to CSV/JSON
- [ ] JavaScript redirect detection
- [ ] Performance optimizations
- [ ] Keyboard shortcuts

### Long Term

**Machine Learning Features:**
- [ ] ML-powered phishing detection model
- [ ] Smart tracking parameter classification
- [ ] Behavioral anomaly detection for suspicious redirects
- [ ] Federated learning for collaborative threat intelligence
- [ ] NLP-based link context analysis

## 📊 For Data Scientists

This project is designed to bridge browser extension development with ML/data science:

### Data Collection Opportunities

The extension logs structured data about:
- URL patterns and tracking parameters
- Redirect chains and their characteristics
- User behavior (which links get clicked, which get whitelisted)
- Performance metrics

### Potential ML Applications

1. **Phishing Detection**: Train classifier on URL features
2. **Smart Parameter Filtering**: Learn which params are functional vs tracking
3. **Anomaly Detection**: Flag unusual redirect patterns
4. **Recommendation System**: Suggest whitelist additions

### Export Your Data

Statistics can be exported for analysis in Python/R:
```javascript
// From browser console
chrome.storage.local.get(['linkStats'], (result) => {
  console.log(JSON.stringify(result));
});
```

## 🤝 Contributing

This is currently a personal project, but contributions are welcome!

### Areas for Contribution

- Expanding the tracking parameter list
- Testing on different websites and reporting issues
- Performance optimizations
- UI/UX improvements
- Documentation improvements

## 📝 Development Notes

### Technology Stack

- **JavaScript (ES6+)**: Core language
- **Chrome Extension Manifest V3**: Extension framework
- **Web APIs**: Fetch, URLSearchParams, Chrome Extension APIs
- **No external dependencies**: Vanilla JS only (for now)

### Design Decisions

1. **Manifest V3 over V2**: Future-proofing (V2 being deprecated)
2. **Inline code in background.js**: Avoids bundler complexity for MVP
3. **HEAD requests for redirects**: Efficient, doesn't download full page
4. **5-second timeout**: Balance between thoroughness and UX
5. **Graceful degradation**: Always falls back to original URL on errors

### Performance Considerations

- Uses `HEAD` requests (no body download)
- Implements timeouts to prevent hanging
- Runs in background worker (non-blocking)
- Statistics stored locally (no server calls)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

Built as a learning project to bridge browser extension development with machine learning and data science.

---

## 🆘 Support

### Common Issues

**Extension doesn't load:**
- Check manifest.json syntax (use jsonlint.com)
- Verify all files are in the folder
- Check for errors in `chrome://extensions/`

**Links aren't processed:**
- Verify extension is enabled (check popup)
- Check console for JavaScript errors
- Try reloading the extension

**Slow navigation:**
- Expected behavior (tracing redirects takes time)
- Will improve with caching in future versions

**CORS errors:**
- Normal for many sites
- Extension falls back to original URL
- Not a bug, browser security feature

### Getting Help

1. Check the console logs (both page and service worker)
2. Review `SETUP.md` for detailed troubleshooting
3. Open an issue on GitHub (if applicable)

---

**Last Updated:** 2025 
**Status:** In Active Development 🚧