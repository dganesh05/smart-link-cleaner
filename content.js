// Content script: Runs on every webpage to intercept link clicks

console.log('Smart Link Cleaner: Content script loaded');

// Listen for all clicks on the page
document.addEventListener('click', async (event) => {
  // Find the closest <a> tag (in case user clicked on something inside a link)
  const link = event.target.closest('a');
  
  if (!link || !link.href) {
    return; // Not a link or no href
  }
  
  // Ignore special links
  if (link.href.startsWith('javascript:') || 
      link.href.startsWith('mailto:') ||
      link.href.startsWith('tel:') ||
      link.href.startsWith('#')) {
    return;
  }
  
  // Check if user wants to open in new tab (Ctrl/Cmd + click, or middle click)
  const openInNewTab = event.ctrlKey || event.metaKey || event.button === 1;
  
  // Prevent default navigation
  event.preventDefault();
  event.stopPropagation();
  
  // Show loading indicator (optional - we'll add this later)
  showLoadingIndicator(link);
  
  try {
    // Send message to background script to process the URL
    const response = await chrome.runtime.sendMessage({
      action: 'processUrl',
      url: link.href,
      openInNewTab: openInNewTab
    });
    
    if (response.success) {
      // Navigate to the processed URL
      if (openInNewTab) {
        window.open(response.finalUrl, '_blank');
      } else {
        window.location.href = response.finalUrl;
      }
    } else {
      // If processing failed, show error and use original URL
      console.error('Failed to process URL:', response.error);
      
      // Fallback to original URL
      if (openInNewTab) {
        window.open(link.href, '_blank');
      } else {
        window.location.href = link.href;
      }
    }
  } catch (error) {
    console.error('Error communicating with background script:', error);
    
    // Fallback to original URL on error
    if (openInNewTab) {
      window.open(link.href, '_blank');
    } else {
      window.location.href = link.href;
    }
  } finally {
    hideLoadingIndicator(link);
  }
}, true); // Use capture phase to intercept early

// Visual feedback functions
function showLoadingIndicator(link) {
  // Add a subtle loading indicator to the clicked link
  link.style.opacity = '0.6';
  link.style.cursor = 'wait';
  link.setAttribute('data-processing', 'true');
}

function hideLoadingIndicator(link) {
  link.style.opacity = '';
  link.style.cursor = '';
  link.removeAttribute('data-processing');
}

// Listen for right-click context menu (optional: add "Process this link" option later)
document.addEventListener('contextmenu', (event) => {
  const link = event.target.closest('a');
  if (link && link.href) {
    // Store the link for context menu action
    chrome.storage.local.set({ lastContextLink: link.href });
  }
});