// Background service worker: Main logic for URL processing

console.log('Smart Link Cleaner: Background service worker started');

// Import utility functions (we'll need to bundle these or inline them)
// For now, we'll inline the key functions

// ===== URL CLEANING FUNCTIONS =====
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

function cleanUrl(urlString) {
  try {
    const url = new URL(urlString);
    const searchParams = new URLSearchParams(url.search);
    const paramsToKeep = new URLSearchParams();
    
    for (const [key, value] of searchParams) {
      const keyLower = key.toLowerCase();
      const isTracking = TRACKING_PARAMS.some(tracker => 
        keyLower === tracker.toLowerCase() || keyLower.startsWith(tracker.toLowerCase())
      );
      
      if (!isTracking) {
        paramsToKeep.append(key, value);
      }
    }
    
    url.search = paramsToKeep.toString();
    let cleanedUrl = url.toString();
    if (cleanedUrl.endsWith('?')) {
      cleanedUrl = cleanedUrl.slice(0, -1);
    }
    
    return cleanedUrl;
  } catch (error) {
    console.error('Error cleaning URL:', error);
    return urlString;
  }
}

// ===== REDIRECT TRACING FUNCTIONS =====
const MAX_REDIRECTS = 10;
const TIMEOUT_MS = 5000;

async function traceRedirects(url) {
  const redirectChain = [url];
  let currentUrl = url;
  let redirectCount = 0;
  
  try {
    while (redirectCount < MAX_REDIRECTS) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      try {
        const response = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('Location');
          if (!location) break;
          
          const nextUrl = new URL(location, currentUrl).toString();
          
          if (redirectChain.includes(nextUrl)) {
            return {
              success: true,
              finalUrl: currentUrl,
              redirectChain,
              redirectCount,
              error: 'Redirect loop detected'
            };
          }
          
          redirectChain.push(nextUrl);
          currentUrl = nextUrl;
          redirectCount++;
        } else {
          break;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (redirectCount > 0) {
          return {
            success: true,
            finalUrl: redirectChain[redirectChain.length - 1],
            redirectChain,
            redirectCount,
            error: `Stopped early: ${fetchError.message}`
          };
        }
        
        return {
          success: false,
          finalUrl: url,
          redirectChain: [url],
          redirectCount: 0,
          error: `Failed to trace: ${fetchError.message}`
        };
      }
    }
    
    return {
      success: true,
      finalUrl: currentUrl,
      redirectChain,
      redirectCount,
      hitMaxRedirects: redirectCount >= MAX_REDIRECTS
    };
    
  } catch (error) {
    return {
      success: false,
      finalUrl: url,
      redirectChain,
      redirectCount,
      error: error.message
    };
  }
}

// ===== MAIN PROCESSING FUNCTION =====
async function processUrl(originalUrl) {
  console.log('Processing URL:', originalUrl);
  
  const startTime = Date.now();
  const stats = {
    originalUrl,
    steps: []
  };
  
  try {
    // Step 1: Trace redirects
    stats.steps.push({ step: 'trace_start', url: originalUrl });
    
    const traceResult = await traceRedirects(originalUrl);
    
    if (traceResult.success) {
      stats.steps.push({ 
        step: 'trace_complete', 
        url: traceResult.finalUrl,
        redirectCount: traceResult.redirectCount 
      });
    } else {
      stats.steps.push({ 
        step: 'trace_failed', 
        error: traceResult.error,
        fallback: originalUrl 
      });
    }
    
    // Use traced URL if successful, otherwise use original
    const urlToClean = traceResult.success ? traceResult.finalUrl : originalUrl;
    
    // Step 2: Clean tracking parameters
    const cleanedUrl = cleanUrl(urlToClean);
    
    stats.steps.push({ 
      step: 'clean_complete', 
      url: cleanedUrl,
      removed: urlToClean !== cleanedUrl 
    });
    
    const processingTime = Date.now() - startTime;
    
    // Log statistics
    console.log('Processing complete:', {
      original: originalUrl,
      final: cleanedUrl,
      time: processingTime + 'ms',
      redirects: traceResult.redirectCount
    });
    
    // Save statistics for analytics (optional)
    await saveProcessingStats(stats, processingTime);
    
    return {
      success: true,
      finalUrl: cleanedUrl,
      stats: {
        redirectCount: traceResult.redirectCount,
        cleaned: urlToClean !== cleanedUrl,
        processingTime
      }
    };
    
  } catch (error) {
    console.error('Error processing URL:', error);
    
    return {
      success: false,
      finalUrl: originalUrl, // Fallback to original
      error: error.message
    };
  }
}

// ===== STATISTICS TRACKING =====
async function saveProcessingStats(stats, processingTime) {
  try {
    // Get existing stats
    const result = await chrome.storage.local.get(['linkStats']);
    const linkStats = result.linkStats || {
      totalProcessed: 0,
      totalRedirects: 0,
      totalCleaned: 0,
      averageTime: 0
    };
    
    // Update stats
    linkStats.totalProcessed++;
    
    const lastStep = stats.steps[stats.steps.length - 1];
    if (lastStep.redirectCount > 0) {
      linkStats.totalRedirects += lastStep.redirectCount;
    }
    
    if (lastStep.removed) {
      linkStats.totalCleaned++;
    }
    
    // Update average processing time
    const n = linkStats.totalProcessed;
    linkStats.averageTime = ((linkStats.averageTime * (n - 1)) + processingTime) / n;
    
    // Save updated stats
    await chrome.storage.local.set({ linkStats });
    
  } catch (error) {
    console.error('Error saving stats:', error);
  }
}

// ===== MESSAGE LISTENER =====
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processUrl') {
    // Process URL asynchronously
    processUrl(request.url).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({
        success: false,
        finalUrl: request.url,
        error: error.message
      });
    });
    
    // Return true to indicate async response
    return true;
  }
  
  if (request.action === 'getStats') {
    chrome.storage.local.get(['linkStats']).then(result => {
      sendResponse(result.linkStats || {});
    });
    return true;
  }
});

// ===== INITIALIZATION =====
chrome.runtime.onInstalled.addListener(() => {
  console.log('Smart Link Cleaner installed');
  
  // Initialize storage
  chrome.storage.local.set({
    linkStats: {
      totalProcessed: 0,
      totalRedirects: 0,
      totalCleaned: 0,
      averageTime: 0
    }
  });
});