const MAX_REDIRECTS = 10;
const TIMEOUT_MS = 5000; // 5 seconds

/**
 * Trace redirects and return the final destination URL
 * @param {string} url - The starting URL
 * @returns {Promise<object>} - Result object with final URL and trace info
 */
async function traceRedirects(url) {
  const redirectChain = [url];
  let currentUrl = url;
  let redirectCount = 0;
  
  try {
    while (redirectCount < MAX_REDIRECTS) {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      
      try {
        // Fetch with manual redirect handling
        const response = await fetch(currentUrl, {
          method: 'HEAD', // Use HEAD for efficiency (no body download)
          redirect: 'manual', // Don't follow redirects automatically
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Check if this is a redirect
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('Location');
          
          if (!location) {
            // Redirect without location header - stop here
            break;
          }
          
          // Handle relative URLs
          const nextUrl = new URL(location, currentUrl).toString();
          
          // Check for redirect loops
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
          // No more redirects
          break;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // If it's an abort error (timeout)
        if (fetchError.name === 'AbortError') {
          return {
            success: false,
            finalUrl: url, // Return original URL on timeout
            redirectChain,
            redirectCount,
            error: 'Timeout while tracing redirects'
          };
        }
        
        // For CORS or network errors, return what we have so far
        // If we got at least one redirect, use the last successful one
        if (redirectCount > 0) {
          return {
            success: true,
            finalUrl: redirectChain[redirectChain.length - 1],
            redirectChain,
            redirectCount,
            error: `Stopped early: ${fetchError.message}`
          };
        }
        
        // If we couldn't even make the first request, return original
        return {
          success: false,
          finalUrl: url,
          redirectChain: [url],
          redirectCount: 0,
          error: `Failed to trace: ${fetchError.message}`
        };
      }
    }
    
    // Successfully traced to the end (or hit max redirects)
    return {
      success: true,
      finalUrl: currentUrl,
      redirectChain,
      redirectCount,
      hitMaxRedirects: redirectCount >= MAX_REDIRECTS
    };
    
  } catch (error) {
    // Unexpected error
    return {
      success: false,
      finalUrl: url, // Return original URL on error
      redirectChain,
      redirectCount,
      error: error.message
    };
  }
}

/**
 * Analyze a redirect chain for suspicious patterns
 * @param {Array<string>} redirectChain - The chain of URLs
 * @returns {object} - Analysis results
 */
function analyzeRedirectChain(redirectChain) {
  if (!redirectChain || redirectChain.length <= 1) {
    return {
      suspicious: false,
      reasons: []
    };
  }
  
  const reasons = [];
  const domains = redirectChain.map(url => {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }).filter(Boolean);
  
  // Check for excessive redirects
  if (redirectChain.length > 5) {
    reasons.push(`Excessive redirects (${redirectChain.length})`);
  }
  
  // Check for domain diversity (many different domains might be suspicious)
  const uniqueDomains = new Set(domains);
  if (uniqueDomains.size > 3) {
    reasons.push(`Multiple domains in chain (${uniqueDomains.size})`);
  }
  
  // Check for known URL shorteners (these are common but good to track)
  const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co'];
  const hasShortener = domains.some(domain => 
    shorteners.some(shortener => domain.includes(shortener))
  );
  
  if (hasShortener) {
    reasons.push('Contains URL shortener');
  }
  
  return {
    suspicious: reasons.length > 0,
    reasons,
    domainCount: uniqueDomains.size,
    totalRedirects: redirectChain.length - 1
  };
}

/**
 * Get a summary of the redirect trace for display
 * @param {object} traceResult - Result from traceRedirects()
 * @returns {string} - Human-readable summary
 */
function getTraceSummary(traceResult) {
  if (!traceResult.success) {
    return `Failed to trace: ${traceResult.error}`;
  }
  
  if (traceResult.redirectCount === 0) {
    return 'No redirects found';
  }
  
  const analysis = analyzeRedirectChain(traceResult.redirectChain);
  
  let summary = `Followed ${traceResult.redirectCount} redirect(s)`;
  
  if (analysis.suspicious) {
    summary += ` ⚠️ ${analysis.reasons.join(', ')}`;
  }
  
  return summary;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    traceRedirects, 
    analyzeRedirectChain, 
    getTraceSummary 
  };
}