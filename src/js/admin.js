// Admin dashboard logic with Connection Test
// XLSX loaded via CDN in HTML - no import needed

// Check authentication
checkAdminAuth();

// DOM Elements
const logoutBtn = document.getElementById('logout-btn');
const addTokenBtn = document.getElementById('add-token-btn');
const aiSettingsBtn = document.getElementById('ai-settings-btn'); // NEW
const bulkUploadBtn = document.getElementById('bulk-upload-btn');
const refreshBtn = document.getElementById('refresh-btn');
const tokenTableBody = document.getElementById('token-table-body');
const addModal = document.getElementById('add-modal');
const bulkModal = document.getElementById('bulk-modal');
const aiModal = document.getElementById('ai-modal'); // NEW
const filterTabs = document.querySelectorAll('.filter-tab');

// Statistics
const statTotal = document.getElementById('stat-total');
const statAdmin = document.getElementById('stat-admin');
const statVip = document.getElementById('stat-vip');
const statUser = document.getElementById('stat-user');

// Modal controls
const cancelAddBtn = document.getElementById('cancel-add-btn');
const confirmAddBtn = document.getElementById('confirm-add-btn');
const newTokenInput = document.getElementById('new-token');
const newTokenType = document.getElementById('new-token-type');
const generateTokenBtn = document.getElementById('generate-token-btn');

const cancelBulkBtn = document.getElementById('cancel-bulk-btn');
const confirmBulkBtn = document.getElementById('confirm-bulk-btn');
const uploadArea = document.getElementById('upload-area');
const excelFileInput = document.getElementById('excel-file');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const tokenCount = document.getElementById('token-count');

// AI Modal Controls
const cancelAiBtn = document.getElementById('cancel-ai-btn');
const saveAiBtn = document.getElementById('save-ai-btn');
const aiProviderSelect = document.getElementById('ai-provider');
const geminiKeyInput = document.getElementById('gemini-key');
const openrouterKeyInput = document.getElementById('openrouter-key');
const aiModelSelect = document.getElementById('ai-model-select');
const currentProviderDisplay = document.getElementById('current-provider-display');
const currentModelDisplay = document.getElementById('current-model-display');
const geminiKeyStatus = document.getElementById('gemini-key-status');
const openrouterKeyStatus = document.getElementById('openrouter-key-status');
const modelHelpText = document.getElementById('model-help-text');
const detectGeminiBtn = document.getElementById('detect-gemini-btn');
const detectOpenRouterBtn = document.getElementById('detect-openrouter-btn');
const geminiKeyContainer = document.getElementById('gemini-key-container');
const openrouterKeyContainer = document.getElementById('openrouter-key-container');

// State
let currentFilter = 'all';
let allTokens = [];
let bulkTokensData = [];

// Event Listeners
logoutBtn?.addEventListener('click', logout);
addTokenBtn?.addEventListener('click', () => showModal('add'));
aiSettingsBtn?.addEventListener('click', () => { showModal('ai'); loadAIConfig(); }); // NEW
bulkUploadBtn?.addEventListener('click', () => showModal('bulk'));
refreshBtn?.addEventListener('click', loadTokens);
cancelAddBtn?.addEventListener('click', () => hideModal('add'));
cancelBulkBtn?.addEventListener('click', () => hideModal('bulk'));
cancelAiBtn?.addEventListener('click', () => hideModal('ai')); // NEW
confirmAddBtn?.addEventListener('click', addToken);
confirmBulkBtn?.addEventListener('click', bulkUpload);
saveAiBtn?.addEventListener('click', saveAIConfig); // NEW
generateTokenBtn?.addEventListener('click', generateRandomToken);

// Provider Change Handler - auto-populate models
aiProviderSelect?.addEventListener('change', () => {
    updateUIForProvider();
    populateModels();
});

// Detect buttons - fetch models with custom API keys
detectGeminiBtn?.addEventListener('click', () => detectModelsWithKey('gemini'));
detectOpenRouterBtn?.addEventListener('click', () => detectModelsWithKey('openrouter'));

uploadArea?.addEventListener('click', () => excelFileInput?.click());
excelFileInput?.addEventListener('change', handleFileSelect);

filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderTokens();
    });
});

// Functions
function checkAdminAuth() {
    const session = sessionStorage.getItem('dosbing_session');
    if (!session) {
        window.location.href = '/';
        return;
    }

    try {
        const data = JSON.parse(session);
        if (data.role !== 'admin') {
            alert('Access denied. Admin only.');
            window.location.href = '/';
        }
    } catch (e) {
        window.location.href = '/';
    }
}

function logout() {
    sessionStorage.removeItem('dosbing_session');
    window.location.href = '/';
}

function showModal(type) {
    if (type === 'add') {
        addModal?.classList.remove('hidden');
        newTokenInput.value = '';
    } else if (type === 'bulk') {
        bulkModal?.classList.remove('hidden');
        fileInfo?.classList.add('hidden');
        confirmBulkBtn.disabled = true;
        bulkTokensData = [];
    } else if (type === 'ai') {
        aiModal?.classList.remove('hidden');
    }
}

function hideModal(type) {
    if (type === 'add') {
        addModal?.classList.add('hidden');
    } else if (type === 'bulk') {
        bulkModal?.classList.add('hidden');
    } else if (type === 'ai') {
        aiModal?.classList.add('hidden');
    }
}

function updateUIForProvider() {
    const provider = aiProviderSelect.value;

    // Show/hide API key inputs based on provider
    if (provider === 'gemini') {
        geminiKeyContainer.style.display = 'block';
        openrouterKeyContainer.style.display = 'none';
        modelHelpText.textContent = 'Select from available Gemini models';
    } else if (provider === 'openrouter') {
        geminiKeyContainer.style.display = 'none';
        openrouterKeyContainer.style.display = 'block';
        modelHelpText.textContent = 'Select from available OpenRouter models (auto-loaded)';
    }
}

async function populateModels() {
    const provider = aiProviderSelect.value;

    // Clear existing options
    aiModelSelect.innerHTML = '<option value="">Loading models...</option>';

    if (provider === 'gemini') {
        // Auto-fetch Gemini models from Google AI API
        await fetchGeminiModels();
    } else if (provider === 'openrouter') {
        // Auto-fetch OpenRouter models
        await fetchOpenRouterModels();
    }
}

async function fetchGeminiModels() {
    try {
        const response = await fetch('/api/admin/list-gemini-models');
        const data = await response.json();

        if (response.ok && data.success) {
            // Clear loading state
            aiModelSelect.innerHTML = '<option value="">Select a model...</option>';

            // Add new options
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;

                // Format: Name (Token Limit)
                let text = model.name;
                if (model.input_token_limit) {
                    text += ` (${Math.round(model.input_token_limit / 1000)}k)`;
                }
                option.text = text;
                aiModelSelect.add(option);
            });

            console.log(`✅ Loaded ${data.count} Gemini models`);
        } else {
            // Fallback to basic options if API fails
            aiModelSelect.innerHTML = '<option value="">Select a model...</option>';
            const fallbackModels = [
                { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' },
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
            ];
            fallbackModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.text = model.name;
                aiModelSelect.add(option);
            });
            console.warn('Failed to fetch Gemini models, using fallback list');
        }
    } catch (error) {
        // Fallback to basic options if network error
        aiModelSelect.innerHTML = '<option value="">Select a model...</option>';
        const fallbackModels = [
            { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
        ];
        fallbackModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.text = model.name;
            aiModelSelect.add(option);
        });
        console.error('Error fetching Gemini models:', error);
    }
}

async function fetchGeminiModelsWithKey(apiKey) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMsg = `API returned ${response.status}`;

            if (response.status === 403) {
                errorMsg = 'API key tidak valid atau tidak memiliki akses. Periksa kembali API key Anda di Google AI Studio.';
            } else if (response.status === 400) {
                errorMsg = 'Format API key salah. Pastikan Anda copy key yang benar.';
            } else if (errorData.error) {
                errorMsg = errorData.error.message || errorMsg;
            }

            throw new Error(errorMsg);
        }

        const data = await response.json();

        // Filter and transform models
        const models = data.models
            .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
            .map(model => ({
                id: model.name.replace('models/', ''),
                name: model.displayName || model.name,
                input_token_limit: model.inputTokenLimit || 0
            }))
            .sort((a, b) => {
                if (a.name.includes('exp') && !b.name.includes('exp')) return -1;
                if (!a.name.includes('exp') && b.name.includes('exp')) return 1;
                return a.name.localeCompare(b.name);
            });

        return { success: true, models, count: models.length };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function fetchOpenRouterModelsWithKey(apiKey) {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        // Transform models
        const models = data.data.map(model => ({
            id: model.id,
            name: model.name || model.id,
            context_length: model.context_length || 0
        })).sort((a, b) => {
            if (a.id.includes('gemini') && !b.id.includes('gemini')) return -1;
            if (!a.id.includes('gemini') && b.id.includes('gemini')) return 1;
            if (a.id.includes('gpt') && !b.id.includes('gpt')) return -1;
            if (!a.id.includes('gpt') && b.id.includes('gpt')) return 1;
            return a.name.localeCompare(b.name);
        });

        return { success: true, models, count: models.length };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function detectModelsWithKey(provider) {
    const apiKey = provider === 'gemini' ? geminiKeyInput.value.trim() : openrouterKeyInput.value.trim();

    if (!apiKey) {
        alert(`Please enter ${provider === 'gemini' ? 'Gemini' : 'OpenRouter'} API key first`);
        return;
    }

    // Show loading
    const btn = provider === 'gemini' ? detectGeminiBtn : detectOpenRouterBtn;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    aiModelSelect.innerHTML = '<option value="">Detecting models...</option>';

    try {
        let result;
        if (provider === 'gemini') {
            result = await fetchGeminiModelsWithKey(apiKey);
        } else {
            result = await fetchOpenRouterModelsWithKey(apiKey);
        }

        if (result.success) {
            // Clear and populate dropdown
            aiModelSelect.innerHTML = '<option value="">Select a model...</option>';

            result.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;

                let text = model.name;
                if (provider === 'gemini' && model.input_token_limit) {
                    text += ` (${Math.round(model.input_token_limit / 1000)}k)`;
                } else if (provider === 'openrouter' && model.context_length) {
                    text += ` (${Math.round(model.context_length / 1000)}k)`;
                }

                option.text = text;
                aiModelSelect.add(option);
            });

            alert(`✅ Found ${result.count} models!\n\nAPI key is valid and models loaded.`);

            // Update status indicator
            if (provider === 'gemini') {
                geminiKeyStatus.textContent = '✅ Valid & Detected';
                geminiKeyStatus.className = 'ml-2 text-xs font-normal text-green-600';
            } else {
                openrouterKeyStatus.textContent = '✅ Valid & Detected';
                openrouterKeyStatus.className = 'ml-2 text-xs font-normal text-green-600';
            }
        } else {
            aiModelSelect.innerHTML = '<option value="">Detection failed</option>';
            alert(`❌ Failed to detect models\n\nError: ${result.error}\n\nPlease check your API key.`);

            // Update status indicator
            if (provider === 'gemini') {
                geminiKeyStatus.textContent = '❌ Invalid Key';
                geminiKeyStatus.className = 'ml-2 text-xs font-normal text-red-600';
            } else {
                openrouterKeyStatus.textContent = '❌ Invalid Key';
                openrouterKeyStatus.className = 'ml-2 text-xs font-normal text-red-600';
            }
        }
    } catch (error) {
        aiModelSelect.innerHTML = '<option value="">Error</option>';
        alert(`❌ Error: ${error.message}`);
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}


async function loadAIConfig() {
    try {
        currentProviderDisplay.textContent = 'Loading...';
        currentModelDisplay.textContent = '...';

        const response = await fetch('/api/admin/get-ai-config');
        const data = await response.json();

        if (response.ok) {
            // Update Status Display
            currentProviderDisplay.textContent = data.provider === 'gemini' ? 'Google Gemini' : 'OpenRouter';
            currentModelDisplay.textContent = data.model_name;

            // Set Form Values
            aiProviderSelect.value = data.provider;

            // Update Key Status Indicators
            geminiKeyStatus.textContent = data.has_gemini_key ? '✅ Configured' : '❌ Not Set';
            openrouterKeyStatus.textContent = data.has_openrouter_key ? '✅ Configured' : '❌ Not Set';

            // Clear inputs
            geminiKeyInput.value = '';
            openrouterKeyInput.value = '';

            // Populate models and select current one
            await populateModels();
            aiModelSelect.value = data.model_name;

            updateUIForProvider();

        } else {
            console.error('Failed to load AI config');
            currentProviderDisplay.textContent = 'Error';
        }
    } catch (error) {
        console.error('Error loading AI config:', error);
        currentProviderDisplay.textContent = 'Connection Error';
    }
}

async function fetchOpenRouterModels() {
    try {
        const response = await fetch('/api/admin/list-openrouter-models');
        const data = await response.json();

        if (response.ok && data.success) {
            // Clear loading state
            aiModelSelect.innerHTML = '<option value="">Select a model...</option>';

            // Add new options
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;

                // Format: Name (Context)
                let text = model.name;
                if (model.context_length) {
                    text += ` (${Math.round(model.context_length / 1000)}k)`;
                }
                option.text = text;
                aiModelSelect.add(option);
            });

            console.log(`✅ Loaded ${data.count} OpenRouter models`);
        } else {
            aiModelSelect.innerHTML = '<option value="">Failed to load models</option>';
            console.error('Failed to fetch models:', data.message);
        }
    } catch (error) {
        aiModelSelect.innerHTML = '<option value="">Error loading models</option>';
        console.error('Error fetching OpenRouter models:', error);
    }
}

async function saveAIConfig() {
    const provider = aiProviderSelect.value;
    const model = aiModelSelect.value;

    if (!model) {
        alert('Please select a model from the dropdown');
        return;
    }

    // Get Admin Token for verification
    const session = JSON.parse(sessionStorage.getItem('dosbing_session') || '{}');
    const adminToken = session.token;

    try {
        saveAiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveAiBtn.disabled = true;

        const payload = {
            adminToken,
            provider,
            model_name: model,
            gemini_api_key: geminiKeyInput.value,
            openrouter_api_key: openrouterKeyInput.value
        };

        const response = await fetch('/api/admin/update-ai-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Configuration saved successfully!');
            hideModal('ai');
            loadAIConfig(); // Reload to update status
        } else {
            alert('Failed to save: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error saving config:', error);
        alert('Error saving configuration');
    } finally {
        saveAiBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Simpan Konfigurasi';
        saveAiBtn.disabled = false;
    }
}

function generateRandomToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let token = '';
    for (let i = 0; i < 16; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    newTokenInput.value = token;
}

// CONNECTION TEST FUNCTION
async function testConnection() {
    try {
        console.log('🧪 Testing Supabase connection...');

        // Show loading in table
        tokenTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center">
                    <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-3"></i>
                    <p class="font-bold text-lg">Testing Supabase Connection...</p>
                </td>
            </tr>
        `;

        const response = await fetch('/api/admin/test-connection');
        const data = await response.json();

        console.log('📊 Test result:', data);

        if (data.success) {
            // Success!
            tokenTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <div class="text-green-500 mb-4">
                            <i class="fas fa-check-circle text-5xl mb-3"></i>
                            <p class="font-bold text-xl">✅ Connection Successful!</p>
                            <p class="text-sm text-slate-600 mt-2">Supabase database connected successfully</p>
                        </div>
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4 inline-block text-left">
                            <p class="text-sm"><strong>Database URL:</strong> ${data.details.url}</p>
                            <p class="text-sm"><strong>Token Count:</strong> ${data.details.tokenCount} tokens</p>
                            <p class="text-sm"><strong>Time:</strong> ${new Date(data.details.timestamp).toLocaleString('id-ID')}</p>
                        </div>
                        <div class="mt-6">
                            <button onclick="loadTokens()" class="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700">
                                <i class="fas fa-download mr-2"></i>Load All Tokens
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            // Failed!
            tokenTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <div class="text-red-500 mb-4">
                            <i class="fas fa-times-circle text-5xl mb-3"></i>
                            <p class="font-bold text-xl">❌ Connection Failed!</p>
                            <p class="text-sm text-slate-600 mt-2">${data.error}</p>
                        </div>
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4 inline-block text-left max-w-2xl">
                            <p class="font-bold mb-2">Error Details:</p>
                            ${Object.entries(data.details || {}).map(([key, value]) =>
                `<p class="text-sm"><strong>${key}:</strong> ${value}</p>`
            ).join('')}
                        </div>
                        <div class="mt-6">
                            <button onclick="testConnection()" class="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700">
                                <i class="fas fa-redo mr-2"></i>Retry Test
                            </button>
                            <button onclick="location.href='https://vercel.com/dashboard'" class="bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 ml-2">
                                <i class="fas fa-cog mr-2"></i>Check Vercel Settings
                            </button>
                        </div>
                        <div class="mt-4 text-xs text-slate-500">
                            <p class="font-bold">Troubleshooting:</p>
                            <p>1. Verify environment variables are set in Vercel</p>
                            <p>2. Check SUPABASE_URL and SUPABASE_ANON_KEY values</p>
                            <p>3. Ensure Supabase project is active and accessible</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('❌ Test connection error:', error);
        tokenTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center">
                    <div class="text-red-500 mb-4">
                        <i class="fas fa-exclamation-triangle text-5xl mb-3"></i>
                        <p class="font-bold text-xl">⚠️ Network Error!</p>
                        <p class="text-sm text-slate-600 mt-2">Failed to reach test endpoint</p>
                        <p class="text-sm text-red-600 mt-2">${error.message}</p>
                    </div>
                    <button onclick="testConnection()" class="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700">
                        <i class="fas fa-redo mr-2"></i>Retry
                    </button>
                </td>
            </tr>
        `;
    }
}

// Make testConnection and loadTokens global
window.testConnection = testConnection;
window.loadTokens = loadTokens;

async function loadTokens() {
    try {
        console.log('🔄 Loading tokens from API...');
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
        refreshBtn.disabled = true;

        const response = await fetch(`/api/admin/get-tokens?type=all`);
        const data = await response.json();

        if (response.ok) {
            allTokens = data.tokens;
            updateStatistics();
            renderTokens();
        } else {
            alert('Gagal memuat token');
        }
    } catch (error) {
        console.error('Error loading tokens:', error);
        alert('Error loading tokens');
    } finally {
        refreshBtn.innerHTML = '<i class="fas fa-sync mr-2"></i>Refresh';
        refreshBtn.disabled = false;
    }
}

function updateStatistics() {
    const total = allTokens.length;
    const admin = allTokens.filter(t => t.type === 'admin').length;
    const vip = allTokens.filter(t => t.type === 'vip').length;
    const user = allTokens.filter(t => t.type === 'user').length;

    statTotal.textContent = total;
    statAdmin.textContent = admin;
    statVip.textContent = vip;
    statUser.textContent = user;
}

function renderTokens() {
    const filtered = currentFilter === 'all'
        ? allTokens
        : allTokens.filter(t => t.type === currentFilter);

    if (filtered.length === 0) {
        tokenTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                    <i class="fas fa-inbox text-3xl mb-2"></i>
                    <p class="font-semibold">Tidak ada token</p>
                </td>
            </tr>
        `;
        return;
    }

    tokenTableBody.innerHTML = filtered.map(token => {
        const typeColor = {
            'admin': 'bg-purple-100 text-purple-700',
            'vip': 'bg-amber-100 text-amber-700',
            'user': 'bg-blue-100 text-blue-700'
        }[token.type];

        const statusColor = token.is_used
            ? 'bg-red-100 text-red-700'
            : 'bg-emerald-100 text-emerald-700';

        const statusText = token.is_used ? 'Terpakai' : 'Aktif';

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                    <code class="token-badge bg-slate-100 px-3 py-1 rounded-lg text-slate-700">${token.token}</code>
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${typeColor}">${token.type.toUpperCase()}</span>
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${statusColor}">${statusText}</span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">
                    ${token.used_at ? new Date(token.used_at).toLocaleString('id-ID') : '-'}
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">
                    ${new Date(token.created_at).toLocaleString('id-ID')}
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="deleteToken('${token.id}')" class="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function addToken() {
    const token = newTokenInput.value.trim();
    const type = newTokenType.value;

    if (!token || token.length !== 16) {
        alert('Token harus 16 karakter');
        return;
    }

    try {
        confirmAddBtn.disabled = true;
        confirmAddBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

        const response = await fetch('/api/admin/add-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, type })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Token berhasil ditambahkan');
            hideModal('add');
            loadTokens();
        } else {
            alert(data.error || 'Gagal menambahkan token');
        }
    } catch (error) {
        console.error('Error adding token:', error);
        alert('Error adding token');
    } finally {
        confirmAddBtn.disabled = false;
        confirmAddBtn.innerHTML = 'Tambah';
    }
}

window.deleteToken = async function (id) {
    if (!confirm('Hapus token ini?')) return;

    try {
        const response = await fetch(`/api/admin/delete-token?id=${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Token berhasil dihapus');
            loadTokens();
        } else {
            alert('Gagal menghapus token');
        }
    } catch (error) {
        console.error('Error deleting token:', error);
        alert('Error deleting token');
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    fileName.textContent = file.name;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // Extract tokens from column A (index 0)
            bulkTokensData = jsonData
                .map(row => row[0])
                .filter(token => token && typeof token === 'string' && token.length === 16);

            tokenCount.textContent = bulkTokensData.length;
            fileInfo?.classList.remove('hidden');
            confirmBulkBtn.disabled = bulkTokensData.length === 0;

            if (bulkTokensData.length === 0) {
                alert('Tidak ada token valid ditemukan (harus 16 karakter)');
            }
        } catch (error) {
            console.error('Error parsing Excel:', error);
            alert('Gagal membaca file Excel');
        }
    };
    reader.readAsArrayBuffer(file);
}

async function bulkUpload() {
    if (bulkTokensData.length === 0) return;

    try {
        confirmBulkBtn.disabled = true;
        confirmBulkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        const response = await fetch('/api/admin/bulk-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokens: bulkTokensData })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            hideModal('bulk');
            loadTokens();
        } else {
            alert(data.error || 'Gagal upload token');
        }
    } catch (error) {
        console.error('Error bulk uploading:', error);
        alert('Error uploading tokens');
    } finally {
        confirmBulkBtn.disabled = false;
        confirmBulkBtn.innerHTML = 'Upload';
    }
}

// Initialize with connection test instead of direct token load
console.log('📋 Admin Dashboard Loaded - Run testConnection() to check database');
tokenTableBody.innerHTML = `
    <tr>
        <td colspan="6" class="px-6 py-12 text-center">
            <div class="text-blue-600 mb-4">
                <i class="fas fa-database text-5xl mb-3"></i>
                <p class="font-bold text-xl">Ready to Connect</p>
                <p class="text-sm text-slate-600 mt-2">Test database connection before loading tokens</p>
            </div>
            <button onclick="testConnection()" class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl text-lg">
                <i class="fas fa-plug mr-2"></i>Test Supabase Connection
            </button>
            <p class="text-xs text-slate-400 mt-4">Or click "Refresh" button to load tokens directly</p>
        </td>
    </tr>
`;
