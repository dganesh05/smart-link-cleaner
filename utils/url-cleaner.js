// Comprehensive list of tracking parameters to remove
const TRACKING_PARAMS = [
  // Google Analytics & Ads
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',
  
  // Facebook
  'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_source', 'fb_ref',
  
  // Microsoft/Bing
  'msclkid', 'ms_clkid',
  
  // Twitter
  'twclid', 'tw_source',
  
  // LinkedIn
  'li_source', 'trk',
  
  // Email marketing
  'mc_cid', 'mc_eid', // Mailchimp
  '_hsenc', '_hsmi', // HubSpot
  'vero_id', 'vero_conv',
  
  // Amazon
  'ref_', 'ref', 'psc', 'pd_rd_', 'tag',
  
  // Other common tracking
  'source', 'campaign', 'medium', 'content',
  'aff_id', 'affiliate', 'click_id', 'clickid',
  'yclid', // Yandex
  'igshid', // Instagram
  'hmb_campaign', 'hmb_medium', 'hmb_source',
  
  // Session/analytics IDs
  'sid', 'session_id', 'sessionid', '_ga', 'analytics',
  
  // Referral tracking
  'referrer', 'ref_src', 'referer', 'refid'
];

/**
 * Clean tracking parameters from a URL
 * @param {string} urlString - The URL to clean
 * @returns {string} - Cleaned URL
 */
function cleanUrl(urlString) {
  try {
    const url = new URL(urlString);
    
    // Get all current parameters
    const searchParams = new URLSearchParams(url.search);
    const paramsToKeep = new URLSearchParams();
    
    // Keep only non-tracking parameters
    for (const [key, value] of searchParams) {
      const keyLower = key.toLowerCase();
      
      // Check if this parameter matches any tracking pattern
      const isTracking = TRACKING_PARAMS.some(tracker => {
        return keyLower === tracker.toLowerCase() || 
               keyLower.startsWith(tracker.toLowerCase());
      });
      
      if (!isTracking) {
        paramsToKeep.append(key, value);
      }
    }
    
    // Rebuild URL with cleaned parameters
    url.search = paramsToKeep.toString();
    
    // Remove trailing '?' if no parameters remain
    let cleanedUrl = url.toString();
    if (cleanedUrl.endsWith('?')) {
      cleanedUrl = cleanedUrl.slice(0, -1);
    }
    
    return cleanedUrl;
  } catch (error) {
    console.error('Error cleaning URL:', error);
    return urlString; // Return original if parsing fails
  }
}

/**
 * Check if a URL has tracking parameters
 * @param {string} urlString - The URL to check
 * @returns {boolean} - True if tracking parameters found
 */
function hasTrackingParams(urlString) {
  try {
    const url = new URL(urlString);
    const searchParams = new URLSearchParams(url.search);
    
    for (const [key] of searchParams) {
      const keyLower = key.toLowerCase();
      const isTracking = TRACKING_PARAMS.some(tracker => {
        return keyLower === tracker.toLowerCase() || 
               keyLower.startsWith(tracker.toLowerCase());
      });
      
      if (isTracking) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get statistics about what was removed
 * @param {string} originalUrl
 * @param {string} cleanedUrl
 * @returns {object} - Stats about removed parameters
 */
function getCleaningStats(originalUrl, cleanedUrl) {
  try {
    const original = new URL(originalUrl);
    const cleaned = new URL(cleanedUrl);
    
    const originalParams = new URLSearchParams(original.search);
    const cleanedParams = new URLSearchParams(cleaned.search);
    
    const removed = [];
    for (const [key] of originalParams) {
      if (!cleanedParams.has(key)) {
        removed.push(key);
      }
    }
    
    return {
      totalRemoved: removed.length,
      removedParams: removed,
      originalLength: originalUrl.length,
      cleanedLength: cleanedUrl.length,
      bytesSaved: originalUrl.length - cleanedUrl.length
    };
  } catch (error) {
    return null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { cleanUrl, hasTrackingParams, getCleaningStats };
}