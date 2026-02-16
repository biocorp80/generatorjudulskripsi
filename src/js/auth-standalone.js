// Standalone authentication script (no build required)
// This version works without Vite build process

// ⚙️ CONFIGURATION
const CONFIG = {
    SUPABASE_URL: '', // Will be loaded from env or set manually
    SUPABASE_ANON_KEY: '', // Will be loaded from env or set manually
    USE_SERVERLESS: true // Set to true to use serverless API
};

// DOM Elements
let tokenInput, unlockBtn, charCounter, statusMessage, lockScreen, loadingScreen, toggleVisibility;

// Initialize DOM elements and event listeners
function initializeApp() {
    console.log('🚀 Initializing Dosbing.ai Auth System...');

    // Get DOM elements
    tokenInput = document.getElementById('token-input');
    unlockBtn = document.getElementById('unlock-btn');
    charCounter = document.getElementById('char-counter');
    statusMessage = document.getElementById('status-message');
    lockScreen = document.getElementById('lock-screen');
    loadingScreen = document.getElementById('loading-screen');
    toggleVisibility = document.getElementById('toggle-visibility');

    // Debug log
    console.log('✅ DOM Elements loaded:', {
        tokenInput: !!tokenInput,
        unlockBtn: !!unlockBtn,
        charCounter: !!charCounter,
        toggleVisibility: !!toggleVisibility
    });

    // Event Listeners
    if (tokenInput) {
        // Multiple event handlers for compatibility
        tokenInput.addEventListener('input', handleTokenInput);
        tokenInput.addEventListener('paste', handlePaste);
        tokenInput.addEventListener('keyup', handleTokenInput);
        tokenInput.addEventListener('keypress', handleKeyPress);
        console.log('✅ Token input event listeners attached');
    } else {
        console.error('❌ Token input not found!');
    }

    if (unlockBtn) {
        unlockBtn.addEventListener('click', validateToken);
        console.log('✅ Unlock button event listener attached');
    } else {
        console.error('❌ Unlock button not found!');
    }

    if (toggleVisibility) {
        toggleVisibility.addEventListener('click', togglePasswordVisibility);
        console.log('✅ Toggle visibility event listener attached');
    }

    // Check existing session
    checkExistingSession();

    console.log('✅ Initialization complete!');
}

// Handle paste event separately with delay
function handlePaste(e) {
    console.log('📋 Paste detected');
    setTimeout(() => {
        if (tokenInput) {
            const value = tokenInput.value;
            const length = value.length;
            console.log('📋 Pasted value:', { value, length });
            updateUI(value, length);
        }
    }, 10);
}

// Handle key press
function handleKeyPress(e) {
    if (e.key === 'Enter' && unlockBtn && !unlockBtn.disabled) {
        console.log('⏎ Enter pressed, validating...');
        validateToken();
    }
}

// Handle token input
function handleTokenInput(e) {
    if (!tokenInput) {
        console.error('❌ Token input not available');
        return;
    }

    const value = tokenInput.value;
    const length = value.length;

    console.log('⌨️ Input changed:', { length, firstChar: value[0] || 'empty' });
    updateUI(value, length);
}

// Update UI elements
function updateUI(value, length) {
    if (charCounter) {
        charCounter.textContent = `${length}/16`;
        console.log('📊 Counter updated:', `${length}/16`);
    }

    if (unlockBtn) {
        const shouldEnable = length === 16;
        unlockBtn.disabled = !shouldEnable;
        console.log('🔓 Button state:', shouldEnable ? 'ENABLED' : 'disabled');
    }
}

// Toggle password visibility
function togglePasswordVisibility() {
    if (!tokenInput || !toggleVisibility) return;

    const icon = toggleVisibility.querySelector('i');

    if (tokenInput.type === 'password') {
        tokenInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleVisibility.title = 'Hide Token';
        console.log('👁️ Token visible');
    } else {
        tokenInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleVisibility.title = 'Show Token';
        console.log('👁️ Token hidden');
    }
}

// Validate token
async function validateToken() {
    const token = tokenInput?.value?.trim();

    console.log('🔐 Validating token...', { length: token?.length });

    if (!token || token.length !== 16) {
        showError('Token harus 16 karakter');
        return;
    }

    // Show loading
    if (lockScreen && loadingScreen) {
        lockScreen.classList.add('hidden');
        loadingScreen.classList.remove('hidden');
    }

    try {
        // 🌐 Call serverless API to validate token
        console.log('📡 Calling serverless API...');

        // Call serverless function to validate token
        const response = await fetch('/api/validate-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        const data = await response.json();
        console.log('📡 API Response:', data);

        if (response.ok && data.valid) {
            console.log('✅ Token valid! Role:', data.role);

            // Store session data
            sessionStorage.setItem('dosbing_session', JSON.stringify({
                token: token,
                role: data.role,
                timestamp: Date.now()
            }));

            // Redirect based on role
            if (data.role === 'admin') {
                console.log('🔀 Redirecting to admin dashboard...');
                window.location.href = '/admin.html';
            } else {
                console.log('🔀 Redirecting to app...');
                window.location.href = '/app.html';
            }
        } else {
            console.error('❌ Token validation failed:', data.message);
            showError(data.message || 'Token tidak valid atau sudah terpakai');
        }
    } catch (error) {
        console.error('❌ Validation error:', error);
        showError('Gagal memvalidasi token. Periksa koneksi Anda.');
    }
}

// Show error message
function showError(message) {
    console.error('⚠️ Error:', message);

    if (lockScreen && loadingScreen) {
        loadingScreen.classList.add('hidden');
        lockScreen.classList.remove('hidden');
    }

    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = 'mt-6 p-4 rounded-xl text-center text-sm font-semibold bg-red-50 text-red-700 border border-red-200 shake';
        statusMessage.classList.remove('hidden');

        setTimeout(() => {
            statusMessage.classList.remove('shake');
        }, 500);

        // Hide after 5 seconds
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 5000);
    }

    // Clear input
    if (tokenInput) {
        tokenInput.value = '';
        tokenInput.focus();
    }

    if (charCounter) {
        charCounter.textContent = '0/16';
    }

    if (unlockBtn) {
        unlockBtn.disabled = true;
    }
}

// Check if already authenticated
function checkExistingSession() {
    const session = sessionStorage.getItem('dosbing_session');
    if (session) {
        try {
            const data = JSON.parse(session);
            // Check if session is less than 24 hours old
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                console.log('✅ Existing session found, redirecting...');
                // Redirect based on role
                if (data.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/app.html';
                }
            } else {
                console.log('⏰ Session expired');
                // Session expired
                sessionStorage.removeItem('dosbing_session');
            }
        } catch (e) {
            console.error('❌ Invalid session data');
            sessionStorage.removeItem('dosbing_session');
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    console.log('⏳ Waiting for DOM...');
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    console.log('✅ DOM already loaded');
    initializeApp();
}

console.log('📄 Auth script loaded');
