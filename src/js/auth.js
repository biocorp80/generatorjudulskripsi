// Client-side authentication logic
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// In production, these will come from your Vercel environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// DOM Elements
let tokenInput, unlockBtn, charCounter, statusMessage, lockScreen, loadingScreen, toggleVisibility;

// Initialize DOM elements and event listeners
function initializeApp() {
    // Get DOM elements
    tokenInput = document.getElementById('token-input');
    unlockBtn = document.getElementById('unlock-btn');
    charCounter = document.getElementById('char-counter');
    statusMessage = document.getElementById('status-message');
    lockScreen = document.getElementById('lock-screen');
    loadingScreen = document.getElementById('loading-screen');
    toggleVisibility = document.getElementById('toggle-visibility');

    // Debug log
    console.log('DOM Elements loaded:', {
        tokenInput: !!tokenInput,
        unlockBtn: !!unlockBtn,
        charCounter: !!charCounter,
        toggleVisibility: !!toggleVisibility
    });

    // Event Listeners
    if (tokenInput) {
        // Use 'input' event for better compatibility with paste and typing
        tokenInput.addEventListener('input', handleTokenInput);
        tokenInput.addEventListener('paste', (e) => {
            // Small delay to let paste complete
            setTimeout(() => handleTokenInput(e), 10);
        });
        tokenInput.addEventListener('keyup', handleTokenInput);
        tokenInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && unlockBtn && !unlockBtn.disabled) {
                validateToken();
            }
        });
        console.log('Token input event listeners attached');
    }

    if (unlockBtn) {
        unlockBtn.addEventListener('click', validateToken);
        console.log('Unlock button event listener attached');
    }

    if (toggleVisibility) {
        toggleVisibility.addEventListener('click', togglePasswordVisibility);
        console.log('Toggle visibility event listener attached');
    }

    // Check existing session
    checkExistingSession();
}

// Handle token input
function handleTokenInput(e) {
    if (!tokenInput) return;

    const value = tokenInput.value;
    const length = value.length;

    console.log('Token input changed:', { value, length });

    if (charCounter) {
        charCounter.textContent = `${length}/16`;
    }

    if (unlockBtn) {
        unlockBtn.disabled = length !== 16;
        console.log('Unlock button state:', unlockBtn.disabled ? 'disabled' : 'enabled');
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
    } else {
        tokenInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleVisibility.title = 'Show Token';
    }
}

// Validate token
async function validateToken() {
    const token = tokenInput?.value?.trim();

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
        // Call serverless function to validate token
        const response = await fetch('/api/validate-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.valid) {
            // Store session data
            sessionStorage.setItem('dosbing_session', JSON.stringify({
                token: token,
                role: data.role,
                timestamp: Date.now()
            }));

            // Redirect based on role
            if (data.role === 'admin') {
                window.location.href = '/admin.html';
            } else {
                window.location.href = '/app.html';
            }
        } else {
            showError(data.message || 'Token tidak valid atau sudah terpakai');
        }
    } catch (error) {
        console.error('Validation error:', error);
        showError('Gagal memvalidasi token. Periksa koneksi Anda.');
    }
}

// Show error message
function showError(message) {
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
                // Redirect based on role
                if (data.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/app.html';
                }
            } else {
                // Session expired
                sessionStorage.removeItem('dosbing_session');
            }
        } catch (e) {
            sessionStorage.removeItem('dosbing_session');
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded
    initializeApp();
}
