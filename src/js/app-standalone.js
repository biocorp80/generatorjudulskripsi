// ============================================
// Dosbing.ai Research Generator - Full 11 Steps
// Secure: No client-side API keys
// All AI calls go through /api/ai-request proxy
// ============================================

// =====================
// Application State
// =====================
let userData = {
    nama: '',
    gender: '',
    jurusan: '',
    fakultas: '',
    universitas: '',
    minat: '',
    selectedObject: null,
    selectedProblem: null,
    selectedConnection: null,
    selectedTitle: null,
    selectedStandard: null,
    selectedAnalysis: null,
    selectedLogic: null,
    selectedPlan: null,
    selected5W1H: null,
    selectedInstruments: null
};

// Additional state variables
let savedTitles = [];
let selectedTitle = null;
let originalTitle = '';
let currentTitleBase = '';
let repairedTitle = '';
let standardizedTitle = '';
let finalTitle = '';
let analysisAttempt = 0;
let savedAnalysisData = null;
let savedLogicData = null;
let savedPlanData = null;
let abstractDone = false;
let instrumentsDone = false;
let savedAnalysis5W1H = [];
let savedInstrumentsData = null;
let currentStep = 1;




// =====================
// Authentication
// =====================
function checkAuth() {
    const session = sessionStorage.getItem('dosbing_session');
    if (!session) {
        console.warn('No session found. Redirecting to login...');
        window.location.href = '/';
        return;
    }
    try {
        const data = JSON.parse(session);
        if (data.role === 'admin') {
            const goToDashboard = confirm('Anda login sebagai Admin. Buka dashboard admin?');
            if (goToDashboard) { window.location.href = '/admin.html'; return; }
        }
    } catch (e) {
        console.error('Session parse error:', e);
        sessionStorage.removeItem('dosbing_session');
        window.location.href = '/';
    }
}


// Init app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupLogout();

    // SESSION RESTORE DISABLED - Users always start fresh at step 1
    // This ensures VIP login always begins from the beginning
    console.log('✅ Fresh session - starting at step 1');
});
function setupLogout() {
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        if (confirm('Keluar dari sesi? Progress akan dihapus.')) {
            clearSession();
            sessionStorage.removeItem('dosbing_session');
            window.location.href = '/';
        }
    });
}

// DISABLED: Session save to prevent auto-restore on refresh
// Users will always start fresh at step 1 after login
function saveSession() {
    // No-op - session saving disabled
    // Previously this would save progress to localStorage
    return;
}

// DISABLED: Session load to ensure fresh start
function loadSession() {
    // No-op - session loading disabled
    // Users always start at step 1 on login
    return false;
}

// Clear session data
function clearSession() {
    localStorage.removeItem('dosbing_research_session');
    console.log('Session cleared.');
}


// =====================
// Core AI Function (Secure Proxy)
// =====================
async function fetchAI(prompt, system) {
    console.log('🤖 Calling AI API...');

    try {
        const response = await fetch('/api/ai-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, systemInstruction: system })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('API Error:', errText);
            throw new Error('API Error: ' + response.status);
        }

        const data = await response.json();
        return data;
    } catch (e) {
        console.error('Fetch Error:', e);
        alert('Koneksi AI Gagal: ' + e.message + '\n\nPastikan koneksi internet lancar.');
        throw e;
    }
}

// =====================
// Helpers
// =====================
function cleanText(text) {
    if (!text) return '';
    return text.replace(/[*#_`]/g, '').replace(/\$([a-zA-Z0-9_]+)\$/g, '$1').replace(/:/g, ': ').replace(/\s+/g, ' ').trim();
}

function hideAll() {
    ['step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'step-6', 'step-7', 'step-8', 'step-9', 'step-10', 'step-11', 'loading'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
    const s = document.getElementById('sticky-action');
    if (s) { s.classList.remove('translate-y-0'); s.classList.add('translate-y-full'); }
}

function updateProgress(step) {
    // 10 dots → positions at 0%, 11.1%, ... 100% (i.e. (i-1)/9 * 100)
    const totalDots = 10;
    const width = ((step - 1) / (totalDots - 1)) * 100;
    document.getElementById('progress-fill').style.width = `${width}%`;
    for (let i = 1; i <= totalDots; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (!dot) continue;
        const label = dot.parentElement.querySelector('.step-label');
        dot.className = 'step-dot transition-all duration-300';
        label.className = 'step-label transition-colors duration-300';
        if (i < step) {
            dot.classList.add('bg-emerald-500', 'text-white');
            dot.innerHTML = `<i class="fas fa-check"></i>`;
            label.classList.add('text-emerald-600');
        } else if (i === step) {
            dot.classList.add('bg-blue-600', 'ring-4', 'ring-blue-100');
            dot.innerHTML = '';
            label.classList.add('text-blue-700');
        } else {
            dot.classList.add('bg-slate-200');
            dot.innerHTML = '';
            label.classList.add('text-slate-400');
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Educational tips pool - 30+ varied tips
const researchTips = [
    "Judul penelitian yang baik harus spesifik, terukur, dan feasible untuk diselesaikan dalam waktu 4-6 bulan.",
    "Pastikan objek penelitian Anda memiliki akses data yang realistis sebelum memulai riset.",
    "Research gap adalah kesenjangan pengetahuan yang belum diteliti - ini yang membuat penelitian Anda valuable!",
    "Metodologi kuantitatif cocok untuk menguji hipotesis, sedangkan kualitatif untuk eksplorasi mendalam.",
    "Teori yang kuat adalah fondasi penelitian - jangan skip literature review!",
    "Validitas dan reliabilitas instrumen sangat penting untuk menjaga kualitas data Anda.",
    "Sample size yang tepat bergantung pada metode: kuantitatif butuh minimal 30, kualitatif bisa 5-15 informan.",
    "Plagiarisme bukan hanya copy-paste, parafrase tanpa sitasi juga termasuk!",
    "Judul yang terlalu panjang (>20 kata) biasanya kurang fokus. Keep it concise!",
    "Variabel independen adalah yang mempengaruhi, variabel dependen adalah yang dipengaruhi.",
    "Rumusan masalah harus bisa dijawab dengan data, bukan opini subjektif.",
    "Batasan penelitian (scope) membantu Anda tetap fokus dan tidak overwhelmed.",
    "Konsistensi format sitasi (APA/Chicago/etc) sepanjang skripsi adalah must!",
    "Data primer lebih kuat dari sekunder, tapi lebih sulit dan time-consuming untuk dikumpulkan.",
    "Triangulasi data (dari berbagai sumber) meningkatkan kredibilitas penelitian kualitatif.",
    "Hipotesis harus testable - bisa dibuktikan benar atau salah dengan data.",
    "Pre-test instrumen dulu sebelum turun lapangan - ini menghemat waktu revisi!",
    "Etika penelitian: informed consent, confidentiality, dan voluntary participation adalah wajib.",
    "Abstrak adalah miniatur skripsi - tulis di akhir setelah semua selesai.",
    "Keyword/kata kunci membantu penelitian Anda ditemukan di database akademik.",
    "Gap antara teori dan praktek adalah sumber research problem yang sangat baik.",
    "Fenomena terkini (current issues) biasanya lebih menarik untuk diteliti dan dibahas.",
    "Operasionalisasi variabel: definisikan dengan jelas apa yang Anda ukur dan bagaimana caranya.",
    "Pilot study skala kecil bisa mengidentifikasi masalah sebelum penelitian utama.",
    "Standar sitasi: author(s), year, title, publisher/journal, DOI/URL (jika online).",
    "Novelty penelitian bisa dari: objek baru, metode baru, atau kombinasi variabel baru.",
    "Feasibility penelitian: waktu, biaya, akses data, dan keahlian Anda harus realistis.",
    "Pembahasan (discussion) adalah tempat Anda interpretasikan hasil, bukan sekedar ulang hasil.",
    "Implikasi praktis dan teoretis: jelaskan kontribusi penelitian Anda ke dunia nyata dan ilmu.",
    "Rekomendasi untuk penelitian lanjutan menunjukkan Anda aware ada limitasi dan peluang lebih lanjut."
];

let currentTipIndex = 0;

function showLoading(title, text) {
    hideAll();
    const l = document.getElementById('loading');
    if (l) {
        l.classList.remove('hidden');
        const titleEl = document.getElementById('loading-title');
        if (titleEl) titleEl.innerText = title;

        // Update loading status text if provided
        const statusEl = document.getElementById('loading-status');
        if (statusEl && text) statusEl.innerText = text;

        // Set dynamic educational tip
        const tipsEl = document.getElementById('loading-tips');
        if (tipsEl) {
            const randomTip = researchTips[currentTipIndex % researchTips.length];
            tipsEl.innerHTML = `<p class="text-slate-600 text-sm leading-relaxed italic">"${randomTip}"</p>`;
            currentTipIndex++; // Rotate tips
        }
    }
}

// =====================
// Step 1 → Step 2
// =====================
window.goToStep2 = function () {
    try {
        userData.nama = document.getElementById('nama').value;
        userData.gender = document.getElementById('gender').value;
        userData.jurusan = document.getElementById('jurusan').value;
        userData.fakultas = document.getElementById('fakultas').value;
        userData.universitas = document.getElementById('universitas').value;
        userData.minat = document.getElementById('minat').value;

        if (!userData.nama || !userData.gender || !userData.jurusan) {
            return alert('Mohon lengkapi Nama, Gender, dan Jurusan!');
        }

        currentStep = 2;
        hideAll();

        const step2 = document.getElementById('step-2');
        if (!step2) throw new Error('Element step-2 not found');
        step2.classList.remove('hidden');

        updateProgress(2);

        // Save Step 1 data to sessionStorage for PDF
        sessionStorage.setItem('studentName', userData.nama);
        sessionStorage.setItem('gender', userData.gender);
        sessionStorage.setItem('jurusan', userData.jurusan);
        sessionStorage.setItem('fakultas', userData.fakultas);
        sessionStorage.setItem('university', userData.universitas);
        sessionStorage.setItem('minat', userData.minat);

        saveSession();
    } catch (e) {
        console.error('Navigation Error:', e);
        alert('Gagal lanjut ke Step 2: ' + e.message);
    }
};
window.backToStep1 = function () { hideAll(); document.getElementById('step-1').classList.remove('hidden'); updateProgress(1); };

// =====================
// Step 2: Objek
// =====================
window.fetchAIObjects = async function () {
    const btn = document.getElementById('ai-object-btn');
    btn.disabled = true;
    showLoading('Mencari Objek', 'Menganalisis minat penelitian Anda...');
    try {
        const data = await fetchAI(
            `Anda adalah konsultan penelitian akademik senior. KONTEKS: Mahasiswa ${userData.jurusan}, Fakultas ${userData.fakultas}, ${userData.universitas}, dengan minat penelitian spesifik pada "${userData.minat}". 
            
            TUGAS: Rekomendasikan 8 objek penelitian yang AKADEMIS, SPESIFIK, dan FEASIBLE untuk skripsi S1. Setiap objek harus:
            1. Relevan dengan bidang ${userData.jurusan} dan minat "${userData.minat}"
            2. Memiliki akses data yang realistis (organisasi, instansi, atau kelompok teridentifikasi)
            3. Cukup spesifik untuk dibatasi dalam satu penelitian (bukan terlalu luas)
            4. Memiliki potensi gap penelitian yang dapat dieksplorasi
            
            BATASAN FORMAT: Maksimal 2-5 kata per objek, gunakan bahasa Indonesia yang profesional.
            CONTOH BAIK: "Karyawan PT Telkom Regional Bandung", "UMKM Kuliner Kota Semarang", "Mahasiswa Akuntansi UGM"
            CONTOH BURUK: "Perusahaan", "Masyarakat", "Organisasi" (terlalu umum)
            
            OUTPUT: JSON { objects: [string] }`,
            'Berikan 8 objek penelitian akademis yang spesifik dan feasible. Format JSON { objects: [string] }'
        );
        hideAll();
        document.getElementById('step-2').classList.remove('hidden');
        const list = document.getElementById('ai-objects-list');
        list.innerHTML = '';
        data.objects.forEach((obj, idx) => {
            const d = document.createElement('div');
            d.className = `p-3 bg-slate-50 border-2 border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-300 cursor-pointer text-center fade-in stagger-${(idx % 4) + 1} transition-all`;
            d.innerText = cleanText(obj);
            d.onclick = () => {
                document.getElementById('custom-object').value = cleanText(obj);
                Array.from(list.children).forEach(child => { child.classList.remove('bg-blue-100', 'border-blue-600', 'text-blue-800', 'shadow-md'); child.classList.add('bg-slate-50', 'border-slate-200', 'text-slate-600'); });
                d.classList.remove('bg-slate-50', 'border-slate-200', 'text-slate-600');
                d.classList.add('bg-blue-100', 'border-blue-600', 'text-blue-800', 'shadow-md');
            };
            list.appendChild(d);
        });
        list.classList.remove('hidden');
    } catch (e) { hideAll(); document.getElementById('step-2').classList.remove('hidden'); }
    finally { btn.disabled = false; btn.innerHTML = `<i class="fas fa-sparkles"></i> Rekomendasi AI`; }
};
window.goToStep3 = function () { userData.objek = document.getElementById('custom-object').value; if (!userData.objek) return alert('Isi objek!'); currentStep = 3; hideAll(); document.getElementById('step-3').classList.remove('hidden'); updateProgress(3); sessionStorage.setItem('objek', userData.objek); saveSession(); };
window.backToStep2 = function () { hideAll(); document.getElementById('step-2').classList.remove('hidden'); updateProgress(2); };

// =====================
// Step 3: Masalah
// =====================
window.fetchAIMasalah = async function () {
    const btn = document.getElementById('ai-problem-btn');
    btn.disabled = true;
    showLoading('Identifikasi Masalah', 'Menganalisis research gap potensial...');
    try {
        const data = await fetchAI(
            `Anda adalah peneliti senior bidang ${userData.jurusan} yang ahli mengidentifikasi research gap. 
            
            KONTEKS PENELITIAN:
            - Bidang: ${userData.jurusan}
            - Minat: "${userData.minat}"
            - Objek Penelitian: "${userData.objek}"
            
            TUGAS: Identifikasi 8 masalah penelitian (research problem/gap) yang AKADEMIS dan SIGNIFIKAN pada konteks objek "${userData.objek}". Setiap masalah harus:
            1. Merupakan fenomena nyata yang terjadi/dapat terjadi pada objek tersebut
            2. Memiliki dampak signifikan terhadap bidang ${userData.jurusan}
            3. Belum terpecahkan secara komprehensif (research gap)
            4. Dapat diteliti secara empiris dengan metode ilmiah
            5. Relevan dengan minat "${userData.minat}"
           
            JENIS MASALAH YANG DIHARAPKAN:
            - Penurunan/rendahnya suatu variabel penting
            - Gap antara kondisi ideal vs realitas
            - Ketidaksesuaian/inkonsistensi
            - Hambatan/kendala struktural
            - Fenomena yang perlu dijelaskan
            
            BATASAN: 2-5 kata, gunakan istilah akademis yang tepat.
            CONTOH BAIK: "Rendahnya Kepuasan Kerja", "Gap Kompetensi Digital", "Inkonsistensi Kebijakan Internal"
            CONTOH BURUK: "Ada Masalah", "Kurang Bagus", "Perlu Diperbaiki" (tidak spesifik)
            
            OUTPUT: JSON { problems: [string] }`,
            'Identifikasi 8 research gap yang akademis dan signifikan. Format JSON { problems: [string] }'
        );
        hideAll();
        document.getElementById('step-3').classList.remove('hidden');
        const list = document.getElementById('ai-problems-list');
        list.innerHTML = '';
        data.problems.forEach((p, idx) => {
            const d = document.createElement('div');
            d.className = `p-3 bg-slate-50 border-2 border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-300 cursor-pointer text-center fade-in stagger-${(idx % 4) + 1} transition-all`;
            d.innerText = cleanText(p);
            d.onclick = () => {
                document.getElementById('custom-problem').value = cleanText(p);
                Array.from(list.children).forEach(child => { child.classList.remove('bg-blue-100', 'border-blue-600', 'text-blue-800', 'shadow-md'); child.classList.add('bg-slate-50', 'border-slate-200', 'text-slate-600'); });
                d.classList.remove('bg-slate-50', 'border-slate-200', 'text-slate-600');
                d.classList.add('bg-blue-100', 'border-blue-600', 'text-blue-800', 'shadow-md');
            };
            list.appendChild(d);
        });
        list.classList.remove('hidden');
    } catch (e) { hideAll(); document.getElementById('step-3').classList.remove('hidden'); }
    finally { btn.disabled = false; btn.innerHTML = `<i class="fas fa-search-plus"></i> Rekomendasi AI`; }
};
window.goToStep4 = function () {
    userData.masalah = document.getElementById('custom-problem').value;
    if (!userData.masalah) return alert('Isi masalah!');
    currentStep = 4;
    hideAll();
    document.getElementById('step-4').classList.remove('hidden');
    document.getElementById('display-objek').innerText = userData.objek;
    document.getElementById('display-masalah').innerText = userData.masalah;
    document.getElementById('display-jurusan').innerText = userData.jurusan;
    updateProgress(4);

    // Save Step 3 data to sessionStorage for PDF
    sessionStorage.setItem('masalah', userData.masalah);

    saveSession();
};
window.backToStep3 = function () { hideAll(); document.getElementById('step-3').classList.remove('hidden'); updateProgress(3); };

// =====================
// Step 4: Analisis Kaitan
// =====================
window.fetchAIConnectionAnalysis = async function () {
    const btn = document.getElementById('btn-analisis-kaitan');
    btn.disabled = true;
    showLoading('Analisis Kaitan', 'Memvalidasi kesesuaian akademik...');
    try {
        const data = await fetchAI(
            `Analisis keterkaitan akademik yang ketat. Data Mahasiswa: Jurusan ${userData.jurusan}, Fakultas ${userData.fakultas}, Minat ${userData.minat}. Rencana Riset: Objek "${userData.objek}", Masalah "${userData.masalah}". Tugas: 1. Apakah Objek & Masalah ini RELEVAN dengan Jurusan & Minat mahasiswa? 2. Apakah Masalah logis terjadi pada Objek tersebut? Jawab JUJUR dan AKADEMIS. Output JSON: { is_relevant: boolean, reason: string }`,
            'Output JSON: { is_relevant: boolean, reason: string }'
        );
        hideAll();
        document.getElementById('step-4').classList.remove('hidden');
        const resultDiv = document.getElementById('connection-analysis-result');
        const nextBtn = document.getElementById('btn-next-step-5');
        resultDiv.innerText = cleanText(data.reason);
        resultDiv.classList.remove('hidden');
        if (data.is_relevant) {
            resultDiv.classList.remove('bg-red-50', 'border-red-100', 'text-red-700');
            resultDiv.classList.add('bg-emerald-50', 'border-emerald-100', 'text-emerald-700');
            userData.analisisMasalah = cleanText(data.reason);
            sessionStorage.setItem('connectionAnalysis', cleanText(data.reason));
            nextBtn.disabled = false;
            nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            resultDiv.classList.remove('bg-emerald-50', 'border-emerald-100', 'text-emerald-700');
            resultDiv.classList.add('bg-red-50', 'border-red-100', 'text-red-700');
            nextBtn.disabled = true;
            nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    } catch (e) { hideAll(); document.getElementById('step-4').classList.remove('hidden'); alert('Gagal analisis.'); }
    finally { btn.disabled = false; btn.innerHTML = `<i class="fas fa-gavel"></i> Uji Kelayakan Akademik`; }
};
window.goToStep5 = function () { currentStep = 5; hideAll(); document.getElementById('step-5').classList.remove('hidden'); updateProgress(5); sessionStorage.setItem('metode', userData.metode); saveSession(); };
window.backToStep4 = function () { hideAll(); document.getElementById('step-4').classList.remove('hidden'); updateProgress(4); };

// =====================
// Step 5: Metode
// =====================
window.selectMethod = function (val) {
    userData.metode = val;
    document.querySelectorAll('.option-card').forEach(e => e.classList.remove('border-blue-600', 'ring-4', 'ring-blue-100'));
    const id = val === 'Kuantitatif' ? 'm-kuanti' : val === 'Kualitatif' ? 'm-kuali' : 'm-rnd';
    document.getElementById(id).classList.add('border-blue-600', 'ring-4', 'ring-blue-100');
};
window.confirmData = function () {
    if (!userData.metode) return alert('Pilih metode!');
    document.getElementById('conf-minat').innerText = userData.minat;
    document.getElementById('conf-objek').innerText = userData.objek;
    document.getElementById('conf-masalah').innerText = userData.masalah;
    document.getElementById('conf-metode').innerText = userData.metode;

    // Show/hide warning for single-use token users
    const session = JSON.parse(sessionStorage.getItem('dosbing_session') || '{}');
    const warningEl = document.getElementById('single-use-warning');
    if (warningEl) {
        if (session.role === 'user') {
            warningEl.classList.remove('hidden');
        } else {
            warningEl.classList.add('hidden');
        }
    }

    document.getElementById('confirm-modal').classList.add('active');
};
window.closeConfirmModal = function () { document.getElementById('confirm-modal').classList.remove('active'); };
window.proceedToStep6 = function () {
    // Mark token as used (cutoff) for single-use user tokens
    const session = JSON.parse(sessionStorage.getItem('dosbing_session') || '{}');
    if (session.role === 'user' && session.token) {
        fetch('/api/validate-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: session.token, action: 'mark-used' })
        }).then(res => {
            if (res.ok) console.log('✅ Token berhasil di-cutoff');
            else console.warn('⚠️ Gagal cutoff token');
        }).catch(err => console.error('❌ Token cutoff error:', err));

        // Hide logout button for single-use user after cutoff
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.style.display = 'none';
    }

    // Save Step 5 data to sessionStorage for PDF
    sessionStorage.setItem('metode', userData.metode);
    const variabelText = `Penelitian ${userData.metode} tentang ${userData.masalah} pada ${userData.objek}`;
    sessionStorage.setItem('variabel', variabelText);

    currentStep = 6;
    window.closeConfirmModal();
    executeTitleGeneration();
    saveSession();
};

// =====================
// Step 6: Generate Judul
// =====================
// =====================
// Step 6: Generate Judul
// =====================
async function executeTitleGeneration() {
    currentStep = 6;
    showLoading('Merancang Judul', 'Analisis mendalam sedang berlangsung...');
    updateProgress(6);
    saveSession();

    console.log('📊 Title Generation Started with userData:', {
        nama: userData.nama,
        jurusan: userData.jurusan,
        fakultas: userData.fakultas,
        minat: userData.minat,
        objek: userData.objek,
        masalah: userData.masalah,
        metode: userData.metode
    });

    try {
        const data = await fetchAI(
            `Anda adalah PROFESOR PEMBIMBING dengan keahlian metodologi penelitian untuk skripsi S1. Mahasiswa Anda berasal dari ${userData.jurusan}, ${userData.fakultas}, ${userData.universitas}.
            
            DATA PENELITIAN MAHASISWA:
            - Minat Spesifik: "${userData.minat}"
            - Objek Penelitian: "${userData.objek}"
            - Masalah/Gap: "${userData.masalah}"
            - Pendekatan Metodologi: ${userData.metode}
            
            TUGAS ANDA: Rancang 3 RUTE PENELITIAN (themes/pathways) yang BERBEDA namun tetap koheren dengan data di atas. Setiap rute harus menawarkan perspektif unik dalam meneliti masalah "${userData.masalah}" pada objek "${userData.objek}".
            
            UNTUK SETIAP RUTE, BERIKAN:
            1. **Topic** (theme/fokus penelitian): Tema besar yang menaungi rute ini. Contoh: "Pengaruh Faktor Internal Terhadap Kinerja", "Analisis Strategi Organisasional", "Evaluasi Implementasi Kebijakan"
            
            2. **Phenomenon** (latar belakang fenomena): Jelaskan dalam 2-3 kalimat mengapa masalah "${userData.masalah}" pada "${userData.objek}" penting untuk diteliti dari perspektif rute ini. Sertakan:
               - Kondisi faktual/realitas di lapangan
               - Dampak jika tidak diteliti
               - Urgency akademis
            
            3. **Analysis** (teknik analisis yang cocok): Sebutkan TEKNIK ANALISIS SPESIFIK yang sesuai dengan metode ${userData.metode}. 
               Contoh untuk Kuantitatif: Regresi Linear Berganda, Path Analysis, SEM, ANOVA
               Contoh untuk Kualitatif: Analisis Tematik, Grounded Theory, Fenomenologi, Etnografi
               Contoh untuk R&D: Model ADDIE, Design Thinking, Borg & Gall
            
            4. **Titles** (3 judul penelitian akademis): Buat 3 variasi judul yang:
               - SEMUA ELEMEN TERINTEGRASI: minat "${userData.minat}", objek "${userData.objek}", masalah "${userData.masalah}", metode ${userData.metode}
               - Menggunakan struktur akademis: [Analisis/Pengaruh/Hubungan/Evaluasi/Strategi] [Variabel X] Terhadap/Dalam [Variabel Y] pada/di [Objek] ([Studi Metode] Bidang [Jurusan])
               - Panjang ideal: 12-20 kata
               - Gunakan istilah teknis yang tepat dari bidang ${userData.jurusan}
               - Spesifik dan terukur
               - HINDARI: judul yang terlalu umum, ambigu, atau tidak menunjukkan metodologi
            
            KRITERIA KUALITAS JUDUL:
            ✅ Jelas menunjukkan variabel yang diteliti
            ✅ Objek penelitian teridentifikasi
            ✅ Menunjukkan hubungan/pengaruh antar variabel
            ✅ Metodologi tersirat atau tersurat
            ✅ Konteks penelitian jelas (lokasi/bidang)
            ✅ Bahasa akademis dan formal
            
            OUTPUT FORMAT: JSON { paths: [ { topic: string, phenomenon: string, analysis: string, titles: [string, string, string] } ] }
            
            PENTING: Pastikan setiap judul MATANG, AKADEMIS, dan SIAP DIAJUKAN sebagai proposal skripsi tanpa revisi besar.`,
            'Buat 3 rute penelitian dengan 3 judul berkualitas tinggi per rute. Format JSON { paths: [ { topic: string, phenomenon: string, analysis: string, titles: [string] } ] }'
        );

        console.log('✅ AI Response received:', data);

        if (!data || !data.paths || !Array.isArray(data.paths)) {
            throw new Error('Invalid AI response format: expected {paths: [...]}, got ' + JSON.stringify(data));
        }

        if (data.paths.length === 0) {
            throw new Error('AI returned empty paths array');
        }

        renderResults(data.paths);
    } catch (e) {
        console.error('❌ Title generation error:', e);
        hideAll();
        document.getElementById('step-5').classList.remove('hidden');
        alert('Gagal generate judul: ' + e.message + '\n\nSilakan coba lagi atau gunakan metode berbeda.');
    }
}

function renderResults(paths) {
    hideAll();
    const c = document.getElementById('topics-list');
    c.innerHTML = '';
    savedTitles = paths;

    // Save Step 6 data to sessionStorage for PDF (full paths with topic, phenomenon, analysis)
    sessionStorage.setItem('generatedPaths', JSON.stringify(paths));
    const allTitles = [];
    paths.forEach(path => {
        if (path.titles && Array.isArray(path.titles)) {
            allTitles.push(...path.titles);
        }
    });
    sessionStorage.setItem('generatedTitles', JSON.stringify(allTitles));

    paths.forEach((p, i) => {
        let tHTML = p.titles.map(t => `<div class="title-option p-4 rounded-xl text-sm font-semibold text-slate-700 relative group" onclick="pickTitle(this, '${cleanText(t).replace(/'/g, "\\'")}')" ><div class="absolute right-4 opacity-0 group-[.selected]:opacity-100 text-blue-600"><i class="fas fa-check-circle text-xl"></i></div>${cleanText(t)}</div>`).join('');
        c.innerHTML += `<div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 fade-in stagger-${i + 1}"><div class="flex items-center gap-2 mb-4"><span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">TEMA ${i + 1}</span><h3 class="font-bold text-lg">${cleanText(p.topic)}</h3></div><div class="bg-slate-50 p-4 rounded-xl text-xs mb-4 text-justify"><p><strong>Fenomena:</strong> ${cleanText(p.phenomenon)}</p><p class="mt-2"><strong>Analisis:</strong> ${cleanText(p.analysis)}</p></div><div class="space-y-3">${tHTML}</div></div>`;
    });
    document.getElementById('step-6').classList.remove('hidden');
    document.getElementById('context-summary').innerText = `${userData.jurusan} • ${userData.objek}`;
}
window.pickTitle = function (el, title) {
    selectedTitle = title;
    document.querySelectorAll('.title-option').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    document.getElementById('selected-title-preview').innerText = title;
    const btn = document.getElementById('btn-to-step-7');
    btn.disabled = false;
    btn.classList.replace('bg-slate-200', 'step-gradient');
    btn.classList.replace('text-slate-400', 'text-white');
    btn.classList.remove('cursor-not-allowed');
    document.getElementById('sticky-action').classList.remove('translate-y-full');
    document.getElementById('sticky-action').classList.add('translate-y-0');

    // Save Step 7 data to sessionStorage for PDF
    sessionStorage.setItem('selectedTitle', selectedTitle);
};

// =====================
// Step 7: Klarifikasi
// =====================
window.goToStep7 = function () {
    originalTitle = selectedTitle;
    currentTitleBase = originalTitle;
    document.getElementById('chosen-title-display').innerText = originalTitle;
    document.getElementById('repair-input-box').classList.remove('hidden');
    document.getElementById('comparison-area').classList.add('hidden');
    document.getElementById('repair-instruction').value = '';
    document.getElementById('repair-instruction').disabled = false;
    selectFinalTitle('original');
    currentStep = 7;
    hideAll();
    document.getElementById('step-7').classList.remove('hidden');
    updateProgress(7);
    saveSession();
};
window.backToStep6 = function () { hideAll(); document.getElementById('step-6').classList.remove('hidden'); document.getElementById('sticky-action').classList.remove('translate-y-full'); updateProgress(6); };
window.setRepairInstruction = function (text) { document.getElementById('repair-instruction').value = text; };

window.repairTitle = async function () {
    const instr = document.getElementById('repair-instruction').value;
    if (!instr) return alert('Isi instruksi!');
    const btn = document.getElementById('btn-repair');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        const data = await fetchAI(
            `Anda adalah EDITOR AKADEMIK yang ahli dalam penyempurnaan judul penelitian.
            
            JUDUL ORIGINAL: "${originalTitle}"
            INSTRUKSI REVISI: "${instr}"
            
            TUGAS: Revisi judul di atas sesuai instruksi, dengan tetap mempertahankan:
            - Elemen akademis (variabel, objek, metodologi)
            - Kejelasan dan keterbacaan
            - Standar penulisan ilmiah
            
            PERBAIKI ASPEK:
            - Struktur kalimat (Subject-Verb-Object yang jelas)
            - Terminologi akademis yang tepat
            - Spesifitas objek dan variabel
            - Penambahan konteks jika diperlukan (lokasi, batasan, pendekatan)
            
            HINDARI:
            - Mengubah makna fundamental
            - Menghilangkan elemen penting
            - Membuat terlalu panjang (maksimal 25 kata)
            
            OUTPUT: JSON { repaired_title: string }`,
            'Revisi judul sesuai instruksi secara akademis. Format JSON { repaired_title: string }'
        );
        repairedTitle = cleanText(data.repaired_title);
        document.getElementById('text-repaired').innerText = repairedTitle;
        document.getElementById('text-original').innerText = originalTitle;
        document.getElementById('comparison-area').classList.remove('hidden');
        selectFinalTitle('repaired');
        document.getElementById('repair-instruction').disabled = true;
        btn.innerHTML = `<i class="fas fa-lock"></i> Selesai`;
    } catch (e) { btn.disabled = false; alert('Gagal'); }
};
window.selectFinalTitle = function (type) {
    document.getElementById('opt-original').classList.remove('selected', 'border-blue-600');
    document.getElementById('opt-repaired').classList.remove('selected', 'border-blue-600');
    if (type === 'original') { currentTitleBase = originalTitle; document.getElementById('opt-original').classList.add('selected', 'border-blue-600'); }
    else { currentTitleBase = repairedTitle; document.getElementById('opt-repaired').classList.add('selected', 'border-blue-600'); }
};

// =====================
// Step 8: Standarisasi
// =====================
window.goToStep8 = async function () {
    currentStep = 8;

    // Show loading first (hideAll is called inside showLoading)
    showLoading('Standarisasi Judul', 'Menerapkan standar penulisan ilmiah...');
    updateProgress(8);
    saveSession();
    try {
        const data = await fetchAI(
            `Anda adalah STAF PERPUSTAKAAN UNIVERSITAS yang ahli dalam standarisasi judul skripsi/tesis.
            
            JUDUL YANG PERLU DISTANDARISASI: "${currentTitleBase}"
            
            TUGAS: Standardisasi judul sesuai PEDOMAN PENULISAN ILMIAH Indonesia, meliputi:
            
            1. **KAPITALISASI**: Gunakan Title Case yang Proper - huruf pertama setiap kata penting dikapital, kata penghubung (di, ke, dari, dan, atau, terhadap, pada) lowercase kecuali di awal
            2. **NAMA ILMIAH**: Jika ada nama spesies/organisme, tambahkan nama latin dalam tanda kurung dengan formatNama Latin
            3. **SINGKATAN**: Uraikan singkatan yang tidak lazim, pertahankan yang sudah baku (PT, CV, UMKM, dll)
            4. **TANDA BACA**: Gunakan tanda baca yang benar (titik dua, koma, tanda kurung)
            5. **KONSISTENSI**: Pastikan format konsisten dari awal hingga akhir
            
            CONTOH TRANSFORMASI:
            Input: "Pengaruh motivasi kerja terhadap produktivitas karyawan di PT Maju Jaya"
            Output: "Pengaruh Motivasi Kerja terhadap Produktivitas Karyawan di PT Maju Jaya"
            
            Input: "Analisis Pertumbuhan Tanaman Tomat dengan Pupuk Organik"
            Output: "ANALISIS PERTUMBUHAN TANAMAN TOMAT (SOLANUM LYCOPERSICUM) DENGAN PUPUK ORGANIK"
            
            PENTING: Hanya lakukan standardisasi FORMAT, JANGAN mengubah substansi atau menambah/mengurangi elemen penelitian.
            
            OUTPUT: JSON { standardized_title: string }`,
            'Standardisasi judul sesuai pedoman akademis Indonesia. Format JSON { standardized_title: string }'
        );
        hideAll(); // Hide loading overlay
        document.getElementById('step-8').classList.remove('hidden'); // Show Step 8 again
        document.getElementById('std-title-raw').innerText = currentTitleBase;
        document.getElementById('std-title-std').innerText = cleanText(data.standardized_title);
        standardizedTitle = cleanText(data.standardized_title);

        // Save Step 8 data to sessionStorage for PDF
        sessionStorage.setItem('standardizedTitle', standardizedTitle);

        selectStandardization('std');
        document.getElementById('standardization-result').classList.remove('hidden');
    } catch (e) { alert('Gagal standarisasi.'); window.goToStep9(); }
};
window.selectStandardization = function (type) {
    document.getElementById('std-opt-raw').classList.remove('selected', 'border-blue-600');
    document.getElementById('std-opt-std').classList.remove('selected', 'border-emerald-500');
    if (type === 'raw') { finalTitle = currentTitleBase; document.getElementById('std-opt-raw').classList.add('selected', 'border-blue-600'); }
    else { finalTitle = standardizedTitle; document.getElementById('std-opt-std').classList.add('selected', 'border-emerald-500'); }

    // Save final title selection to sessionStorage for PDF
    sessionStorage.setItem('finalTitle', finalTitle);
};

// =====================
// Step 9: Telaah
// =====================
window.goToStep9 = async function () {
    currentStep = 9;
    analysisAttempt++;

    // Show loading first (hideAll is called inside showLoading)
    showLoading('Telaah Akademik', 'Mengevaluasi kelayakan penelitian...');
    updateProgress(9);
    try {
        const prompt = `Anda adalah TIM PENGUJI SKRIPSI yang akan mengevaluasi kelayakan judul penelitian secara KOMPREHENSIF dan OBJEKTIF.
        
        JUDUL YANG DITELAAH: "${finalTitle}"
        
        KONTEKS MAHASISWA:
        - Program Studi: ${userData.jurusan}
        - Minat Penelitian: "${userData.minat}"
        - Objek Penelitian: "${userData.objek}"
        - Masalah yang Diteliti: "${userData.masalah}"
        - Metode: ${userData.metode}
        
        TUGAS: Evaluasi judul berdasarkan 4 PILAR KELAYAKAN PENELITIAN. Untuk setiap pilar, berikan:
        - Score (0-100): Nilai objektif
        - Reason (penjelasan): Analisis mendalam 3-5 kalimat
        
        **1. NECESSITY (Urgensi/Keharusan)**
        - Mengapa penelitian ini HARUS dilakukan SEKARANG?
        - Apa dampak jika fenomena "${userData.masalah}" tidak segera diteliti?
        - Apakah ada urgency temporal, kondisi khusus, atau kebaruan fenomena?
        - Relevansi dengan kebutuhan ${userData.jurusan} dan kondisi kekinian
        
        **2. NOVELTY (Kebaruan)**
        - Apa yang BARU dari penelitian ini dibanding penelitian sebelumnya?
        - Apakah kombinasi "${userData.minat}" + "${userData.objek}" + "${userData.masalah}" memberikan perspektif unik?
        - Kontribusi ilmiah apa yang diharapkan untuk bidang ${userData.jurusan}?
        - Apakah pendekatan ${userData.metode} pada konteks ini inovatif?
        
        **3. RELEVANCE (Kesesuaian/Relevansi)**
        - Seberapa COCOK judul ini dengan program studi ${userData.jurusan}?
        - Apakah variabel dan objek penelitian sesuai dengan body of knowledge bidang ini?
        - Apakah mahasiswa memiliki akses literatur dan teori yang memadai?
        - Apakah minat "${userData.minat}" align dengan kompetensi lulusan ${userData.jurusan}?
        
        **4. FEASIBILITY (Kelayakan Pelaksanaan)**
        - Apakah penelitian ini BISA DISELESAIKAN dalam waktu skripsi S1 (4-6 bulan)?
        - Apakah objek "${userData.objek}" accessible untuk pengumpulan data?
        - Apakah metode ${userData.metode} feasible dengan sumber daya mahasiswa?
        - Apakah scope penelitian terlalu luas atau sudah tepat?
        
        **KESIMPULAN (Synthesis)**
        Buat kesimpulan menyeluruh dalam 4-6 kalimat yang mencakup:
        - Assessment keseluruhan judul (layak/tidak)
        - Kekuatan utama dari judul ini
        - Kelemahan atau risiko yang perlu diantisipasi
        - Rekomendasi: lanjutkan, revisi minor, atau revisi mayor
        
        PENTING: Berikan penilaian JUJUR dan AKADEMIS. Jika ada kelemahan, sebutkan secara konstruktif.
        
        OUTPUT: JSON { necessity: {score: int, reason: string}, novelty: {score: int, reason: string}, relevance: {score: int, reason: string}, feasibility: {score: int, reason: string}, conclusion: string }`;

        const data = await fetchAI(prompt, 'Output JSON sesuai format.');
        hideAll(); // Hide loading overlay
        document.getElementById('step-9').classList.remove('hidden');
        renderAnalysisResult(data);
        savedAnalysisData = data;

        // Save Step 9 data to sessionStorage for PDF
        sessionStorage.setItem('analysisData', JSON.stringify(savedAnalysisData));
    } catch (e) { alert('Gagal.'); document.getElementById('step-8').classList.remove('hidden'); }
};

function renderAnalysisResult(data) {
    document.getElementById('analysis-result').classList.remove('hidden');
    document.getElementById('analyzed-title').innerText = finalTitle;
    document.getElementById('synthesis-text').innerText = cleanText(data.conclusion);
    const createPillar = (id, label, desc, item) => {
        const el = document.getElementById(id);
        let cur = 0;
        const interval = setInterval(() => { cur += 2; if (cur >= item.score) { cur = item.score; clearInterval(interval); } el.innerText = Math.round(cur) + '%'; el.parentElement.style.borderColor = cur < 60 ? '#ef4444' : cur < 80 ? '#eab308' : '#10b981'; }, 20);
        return `<div class="mb-4"><h4 class="font-bold text-slate-800 text-sm">${label} (${item.score}%)</h4><p class="text-[10px] text-slate-400 italic mb-1">${desc}</p><p class="text-xs text-slate-600 text-justify border-l-2 border-blue-200 pl-2">${cleanText(item.reason)}</p></div>`;
    };
    let feedbackHTML = '';
    feedbackHTML += createPillar('score-urgency-val', 'Necessity (Urgensi)', 'Mengapa penelitian ini harus dilakukan sekarang?', data.necessity);
    feedbackHTML += createPillar('score-novelty-val', 'Novelty (Kebaruan)', 'Apa pembeda dengan penelitian lain?', data.novelty);
    feedbackHTML += createPillar('score-relevance-val', 'Relevance (Kesesuaian)', 'Apakah sesuai bidang ilmu mahasiswa?', data.relevance);
    feedbackHTML += createPillar('score-feasibility-val', 'Feasibility (Kelayakan)', 'Apakah bisa dikerjakan sampai selesai?', data.feasibility);
    document.getElementById('analysis-feedback-container').innerHTML = feedbackHTML;
    const scores = [data.necessity.score, data.novelty.score, data.relevance.score, data.feasibility.score];
    const avg = scores.reduce((a, b) => a + b, 0) / 4;
    const min = Math.min(...scores);
    document.getElementById('avg-score-display').innerText = `Rata-rata Skor: ${Math.round(avg)}%`;
    const container = document.getElementById('analysis-actions');
    if (min >= 40 && avg >= 50) {
        container.innerHTML = `<div class="bg-emerald-50 text-emerald-700 p-4 rounded mb-4 text-center font-bold">Judul Layak Dilanjutkan</div><button onclick="goToStep10()" class="w-full step-gradient text-white font-bold py-4 rounded-xl shadow-lg hover:opacity-90 transition-all">Lanjut</button>`;
    } else {
        if (analysisAttempt < 2)
            container.innerHTML = `<div class="text-red-500 font-bold mb-2">Belum Memenuhi Syarat (Min 40, Avg 50).</div><div class="flex gap-2"><button onclick="goToStep7()" class="flex-1 border p-3 rounded transition-colors hover:bg-slate-50">Revisi Judul</button></div>`;
        else
            container.innerHTML = `<div class="text-amber-500 font-bold mb-2">Skor Rendah. Lanjut dengan risiko.</div><button onclick="goToStep10()" class="w-full bg-slate-800 text-white p-3 rounded hover:bg-black transition-colors">Lanjut Paksa</button>`;
    }
}

// =====================
// Step 10: Kerangka
// =====================
window.goToStep10 = async function () {
    currentStep = 10;
    showLoading('Menyusun Kerangka Penelitian', 'Merancang struktur akademis...');
    updateProgress(10);
    document.getElementById('hypo-title-display').innerText = finalTitle;
    document.getElementById('method-info-badge').innerText = userData.metode;
    let prompt = '', methodDesc = '';
    if (userData.metode === 'Kuantitatif') {
        methodDesc = 'Pendekatan deduktif untuk menguji teori objektif melalui pemeriksaan hubungan antar variabel.';
        prompt = `Judul: "${finalTitle}". Masalah: ${userData.masalah}. Metode: Kuantitatif. Buatkan Rancang Bangun Kerangka Penelitian yang akademis terdiri dari 3 bagian: 1. Desain Penelitian 2. Operasionalisasi Variabel 3. Hipotesis Penelitian. Output JSON: { sections: [ { title: "Desain Penelitian", items: [string] }, { title: "Operasionalisasi Variabel", items: [string] }, { title: "Hipotesis Penelitian", items: [string] } ] }`;
    } else if (userData.metode === 'Kualitatif') {
        methodDesc = 'Pendekatan induktif untuk mengeksplorasi dan memahami makna yang berasal dari masalah sosial atau manusia.';
        prompt = `Judul: "${finalTitle}". Masalah: ${userData.masalah}. Metode: Kualitatif. Buatkan Rancang Bangun Kerangka Penelitian: 1. Pendekatan Penelitian 2. Fokus Penelitian 3. Kerangka Teoretis. Output JSON: { sections: [ { title: "Pendekatan Penelitian", items: [string] }, { title: "Fokus Penelitian", items: [string] }, { title: "Kerangka Teoretis", items: [string] } ] }`;
    } else {
        methodDesc = 'Metode penelitian yang digunakan untuk menghasilkan produk tertentu, dan menguji keefektifan produk tersebut.';
        prompt = `Judul: "${finalTitle}". Masalah: ${userData.masalah}. Metode: R&D. Buatkan Rancang Bangun Kerangka Penelitian: 1. Model Pengembangan 2. Spesifikasi Produk 3. Desain Uji Coba. Output JSON: { sections: [ { title: "Model Pengembangan", items: [string] }, { title: "Spesifikasi Produk", items: [string] }, { title: "Desain Uji Coba", items: [string] } ] }`;
    }
    document.getElementById('method-info-text').innerText = methodDesc;
    try {
        const data = await fetchAI(prompt, 'Output JSON sesuai struktur.');
        savedLogicData = data;

        // Save Step 10 data to sessionStorage for PDF
        sessionStorage.setItem('kerangkaData', JSON.stringify(savedLogicData));

        const container = document.getElementById('logic-content');
        container.innerHTML = '';
        data.sections.forEach(sec => {
            let itemsHTML = sec.items.map(item => `<li class="text-sm text-slate-700 ml-4 list-disc text-justify">${cleanText(item)}</li>`).join('');
            container.innerHTML += `<div class="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm"><h4 class="font-bold text-blue-900 mb-3 border-b pb-2 border-blue-50">${sec.title}</h4><ul class="space-y-2">${itemsHTML}</ul></div>`;
        });
        hideAll();
        document.getElementById('step-10').classList.remove('hidden');
        saveSession();
    } catch (e) { alert('Error kerangka.'); window.goToStep11(); }
};

// =====================
// Step 11: Plan
// =====================
window.goToStep11 = async function () {
    currentStep = 11;
    showLoading('Menyusun Action Plan', 'Merancang langkah-langkah riset...');
    updateProgress(11);
    console.log('📋 Step 11 Started with finalTitle:', finalTitle);
    try {
        const data = await fetchAI(
            `Anda adalah METODOLOG PENELITIAN. Judul: "${finalTitle}". Metode: ${userData.metode}. Objek: "${userData.objek}". Masalah: "${userData.masalah}".
            
            Susun ACTION PLAN dengan 4 komponen:
            1. data_steps (array 5 string): Langkah spesifik pengumpulan data
            2. analysis_steps (array 5 string): Langkah analisis data dengan teknik ${userData.metode}
            3. tips (string): Saran praktis 3-4 kalimat
            4. supervisor_questions (array 5 string): Pertanyaan strategis untuk dosen pembimbing
            
            OUTPUT: JSON { data_steps: [string], analysis_steps: [string], tips: string, supervisor_questions: [string] }`,
            `Output JSON dengan 4 field: data_steps (array), analysis_steps (array), tips (string), supervisor_questions (array)`
        );
        console.log('✅ Step 11 Response:', data);
        if (!data.data_steps || !Array.isArray(data.data_steps)) throw new Error('Missing data_steps');
        savedPlanData = data;

        // Save Step 11 action plan data to sessionStorage for PDF
        if (data.data_steps) sessionStorage.setItem('dataRequirements', JSON.stringify(data.data_steps));
        if (data.analysis_steps) sessionStorage.setItem('dataAnalysis', JSON.stringify(data.analysis_steps));
        if (data.supervisor_questions) sessionStorage.setItem('questions', JSON.stringify(data.supervisor_questions));

        document.getElementById('final-title-display').innerText = finalTitle;
        document.getElementById('final-context-display').innerText = `${userData.metode} | ${userData.jurusan}`;
        const dList = document.getElementById('data-steps');
        dList.innerHTML = '';
        data.data_steps.forEach(s => dList.innerHTML += `<div class="flex items-start gap-2"><i class="fas fa-check-circle text-blue-500 text-xs mt-1"></i><p class="text-sm text-slate-700">${cleanText(s)}</p></div>`);
        const aList = document.getElementById('analysis-steps');
        aList.innerHTML = '';
        data.analysis_steps.forEach(s => aList.innerHTML += `<div class="flex items-start gap-2"><i class="fas fa-check-circle text-emerald-500 text-xs mt-1"></i><p class="text-sm text-slate-700">${cleanText(s)}</p></div>`);
        document.getElementById('ai-tips').innerText = cleanText(data.tips);
        const qList = document.getElementById('supervisor-questions');
        qList.innerHTML = '';
        if (data.supervisor_questions) data.supervisor_questions.forEach(q => qList.innerHTML += `<li>${cleanText(q)}</li>`);
        // Reset bonus sections
        abstractDone = false; instrumentsDone = false;
        document.getElementById('btn-analysis').innerHTML = `<i class="fas fa-search"></i> Mulai Analisis 5W+1H`;
        document.getElementById('btn-analysis').disabled = false;
        document.getElementById('btn-analysis').classList.remove('bg-emerald-100', 'text-emerald-700');
        document.getElementById('btn-analysis').classList.add('bg-blue-50', 'text-blue-700');
        document.getElementById('generated-abstract').classList.add('hidden');
        document.getElementById('btn-instruments').innerHTML = `<i class="fas fa-list-check"></i> Susun Instrumen`;
        document.getElementById('btn-instruments').disabled = false;
        document.getElementById('btn-instruments').classList.remove('bg-emerald-100', 'text-emerald-700');
        document.getElementById('generated-instruments').classList.add('hidden');

        hideAll();
        document.getElementById('step-11').classList.remove('hidden');
        saveSession();
    } catch (e) { console.error('❌ Step 11 Error:', e); alert('Gagal: ' + e.message); hideAll(); document.getElementById('step-10').classList.remove('hidden'); }
};

// =====================
// Bonus: 5W1H & Instruments
// =====================
window.generateAnalysis5W1H = async function () {
    const btn = document.getElementById('btn-analysis');
    btn.disabled = true;
    showLoading('Analisis 5W+1H', 'Menggali kedalaman riset...');
    try {
        const data = await fetchAI(
            `Analisis judul 5W+1H: "${finalTitle}". Masalah: ${userData.masalah}. Metode: ${userData.metode}. Berikan analisis per poin: What, Why, Who, Where, When, How. Output JSON: { points: ["What: ...", "Why: ...", "Who: ...", "Where: ...", "When: ...", "How: ..."] }`,
            `JSON: { points: [string] }`
        );
        hideAll();
        document.getElementById('step-11').classList.remove('hidden');
        savedAnalysis5W1H = data.points;

        // Save 5W+1H data to sessionStorage for PDF
        sessionStorage.setItem('fiveWOneH', JSON.stringify(savedAnalysis5W1H));

        const listHTML = `<ul class="list-none space-y-2 text-sm text-slate-700 text-left">` + data.points.map(p => {
            const parts = p.split(':');
            const label = parts[0];
            const content = parts.slice(1).join(':').trim();
            return `<li><span class="font-bold text-blue-800">${cleanText(label)}:</span> ${cleanText(content)}</li>`;
        }).join('') + `</ul>`;
        document.getElementById('abstract-content').innerHTML = listHTML;
        document.getElementById('generated-abstract').classList.remove('hidden');
        abstractDone = true;
        btn.innerHTML = `<i class="fas fa-check"></i> Analisis Selesai`;
        btn.classList.replace('bg-blue-50', 'bg-emerald-100');
        btn.classList.replace('text-blue-700', 'text-emerald-700');
        updateFinishButton();
    } catch (e) { hideAll(); document.getElementById('step-11').classList.remove('hidden'); btn.disabled = false; btn.innerHTML = `<i class="fas fa-search"></i> Mulai Analisis 5W+1H`; }
};

window.generateInstruments = async function () {
    const btn = document.getElementById('btn-instruments');
    btn.disabled = true;
    showLoading('Menyusun Instrumen', 'Membuat daftar pertanyaan...');
    try {
        const data = await fetchAI(`10 Instrumen (${userData.metode}): "${finalTitle}".`, `JSON: { questions: [string] }`);
        hideAll();
        document.getElementById('step-11').classList.remove('hidden');

        // Save instruments data to sessionStorage for PDF
        if (data.questions) {
            sessionStorage.setItem('instruments', JSON.stringify(data.questions));
        }

        const c = document.getElementById('instruments-content');
        c.innerHTML = '';
        data.questions.forEach((q, i) => c.innerHTML += `<div>${i + 1}. ${cleanText(q)}</div>`);
        document.getElementById('generated-instruments').classList.remove('hidden');
        instrumentsDone = true;
        btn.innerHTML = `<i class="fas fa-check"></i> Instrumen Selesai`;
        btn.classList.remove('bg-emerald-50');
        btn.classList.add('bg-emerald-100');
        updateFinishButton();
    } catch (e) { hideAll(); document.getElementById('step-11').classList.remove('hidden'); btn.disabled = false; btn.innerHTML = `<i class="fas fa-list-check"></i> Susun Instrumen`; }
};

function updateFinishButton() {
    if (abstractDone && instrumentsDone) {
        const btnPDF = document.getElementById('btn-download-pdf');

        // Enable PDF download button
        if (btnPDF) {
            btnPDF.disabled = false;
        }
    }
}

// =====================
// Download .docx
// =====================
function downloadDocx() {
    const inst = document.getElementById('instruments-content')?.innerText || 'Belum digenerate.';
    let logicSection = '';
    if (savedLogicData && savedLogicData.sections) {
        savedLogicData.sections.forEach(sec => {
            logicSection += `<p style="margin:5px 0;"><b>${cleanText(sec.title)}:</b></p><ul style="margin:5px 0 10px 20px;">`;
            sec.items.forEach(item => logicSection += `<li style="margin:3px 0;">${cleanText(item)}</li>`);
            logicSection += `</ul>`;
        });
    }
    const formatList = (arr) => (!arr || !Array.isArray(arr) || arr.length === 0) ? '<p>-</p>' : '<ul style="margin:5px 0 10px 20px;">' + arr.map(item => `<li style="margin:3px 0;">${cleanText(item)}</li>`).join('') + '</ul>';
    let dataSteps = formatList(savedPlanData?.data_steps);
    let anaSteps = formatList(savedPlanData?.analysis_steps);
    let supQuestions = formatList(savedPlanData?.supervisor_questions);
    let analysis5W1H = '';
    if (savedAnalysis5W1H && Array.isArray(savedAnalysis5W1H)) {
        analysis5W1H = savedAnalysis5W1H.map(p => {
            const parts = p.split(':'); const label = parts[0]; const content = parts.slice(1).join(':').trim();
            return `<p style="margin:5px 0;"><b>${cleanText(label)}:</b> ${cleanText(content)}</p>`;
        }).join('');
    }
    let scoreText = '';
    if (savedAnalysisData) {
        const avgScore = Math.round((savedAnalysisData.necessity.score + savedAnalysisData.novelty.score + savedAnalysisData.relevance.score + savedAnalysisData.feasibility.score) / 4);
        scoreText = `
            <table style="width:100%;border-collapse:collapse;margin:10px 0;">
                <tr><td style="padding:8px;background:#f0f9ff;border:1px solid #0ea5e9;">
                    <b>1. Necessity (Urgensi): ${savedAnalysisData.necessity.score}/100</b><br>
                    ${cleanText(savedAnalysisData.necessity.reason)}
                </td></tr>
                <tr><td style="padding:8px;background:#fef3c7;border:1px solid #f59e0b;">
                    <b>2. Novelty (Kebaruan): ${savedAnalysisData.novelty.score}/100</b><br>
                    ${cleanText(savedAnalysisData.novelty.reason)}
                </td></tr>
                <tr><td style="padding:8px;background:#dbeafe;border:1px solid #3b82f6;">
                    <b>3. Relevance (Kesesuaian): ${savedAnalysisData.relevance.score}/100</b><br>
                    ${cleanText(savedAnalysisData.relevance.reason)}
                </td></tr>
                <tr><td style="padding:8px;background:#d1fae5;border:1px solid #10b981;">
                    <b>4. Feasibility (Kelayakan): ${savedAnalysisData.feasibility.score}/100</b><br>
                    ${cleanText(savedAnalysisData.feasibility.reason)}
                </td></tr>
                <tr><td style="padding:8px;background:#ede9fe;border:1px solid #8b5cf6;">
                    <b>Kesimpulan:</b> ${cleanText(savedAnalysisData.conclusion)}
                </td></tr>
                <tr><td style="padding:8px;background:#f3f4f6;border:2px solid #1f2937;text-align:center;">
                    <b>Rata-rata Skor: ${avgScore}%</b>
                </td></tr>
            </table>
        `;
    }
    let optionList = '';
    if (savedTitles && savedTitles.length > 0) {
        savedTitles.forEach((p, i) => {
            optionList += `<div style="background:#f0f9ff;padding:10px;margin:10px 0;border-left:4px solid #0ea5e9;"><b>Tema ${i + 1}: ${cleanText(p.topic)}</b><br><i>Fenomena:</i> ${cleanText(p.phenomenon)}<br><i>Analisis:</i> ${cleanText(p.analysis)}<br><b>Opsi Judul:</b><br>`;
            p.titles.forEach((t, idx) => optionList += `${idx + 1}. ${cleanText(t)}<br>`);
            optionList += `</div>`;
        });
    }

    const content = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6;margin:20px;color:#1f2937;">
    
    <div style="text-align:center;margin-bottom:30px;padding:20px;background:#1d4ed8;border-radius:10px;">
        <h1 style="font-size:24pt;font-weight:bold;margin:5px 0;color:white;">DOSBING.AI</h1>
        <p style="font-size:14pt;color:#e0f2fe;font-style:italic;margin:5px 0;">Deskripsi Judul Penelitian - AI Research Generator</p>
    </div>

    <div style="background:#1d4ed8;color:white;padding:10px 15px;margin:20px 0 10px 0;border-radius:5px;">
        <h3 style="font-size:13pt;margin:0;font-weight:bold;">I. DATA PENELITI</h3>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:10px 0;">
        <tr><td style="padding:6px 10px;width:150px;font-weight:bold;color:#1d4ed8;border-bottom:1px solid #e5e7eb;">Nama</td><td style="padding:6px 10px;width:10px;border-bottom:1px solid #e5e7eb;">:</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${userData.nama}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:bold;color:#1d4ed8;border-bottom:1px solid #e5e7eb;">Gender</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">:</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${userData.gender}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:bold;color:#1d4ed8;border-bottom:1px solid #e5e7eb;">Jurusan</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">:</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${userData.jurusan}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:bold;color:#1d4ed8;border-bottom:1px solid #e5e7eb;">Fakultas</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">:</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${userData.fakultas}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:bold;color:#1d4ed8;border-bottom:1px solid #e5e7eb;">Perguruan Tinggi</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">:</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${userData.universitas}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:bold;color:#1d4ed8;">Minat Khusus</td><td style="padding:6px 10px;">:</td><td style="padding:6px 10px;">${userData.minat}</td></tr>
    </table>

    <div style="background:#1d4ed8;color:white;padding:10px 15px;margin:20px 0 10px 0;border-radius:5px;">
        <h3 style="font-size:13pt;margin:0;font-weight:bold;">II. FOKUS PENELITIAN</h3>
    </div>
    <table style="width:100%;border-collapse:collapse;margin:10px 0;">
        <tr><td style="padding:6px 10px;width:150px;font-weight:bold;color:#1d4ed8;border-bottom:1px solid #e5e7eb;">Objek</td><td style="padding:6px 10px;width:10px;border-bottom:1px solid #e5e7eb;">:</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${userData.objek}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:bold;color:#1d4ed8;border-bottom:1px solid #e5e7eb;">Masalah</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">:</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${userData.masalah}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:bold;color:#1d4ed8;border-bottom:1px solid #e5e7eb;">Analisis Kaitan</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">:</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${userData.analisisMasalah || '-'}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:bold;color:#1d4ed8;">Metode</td><td style="padding:6px 10px;">:</td><td style="padding:6px 10px;">${userData.metode}</td></tr>
    </table>

    <div style="background:#1d4ed8;color:white;padding:10px 15px;margin:20px 0 10px 0;border-radius:5px;">
        <h3 style="font-size:13pt;margin:0;font-weight:bold;">III. JUDUL PENELITIAN FINAL</h3>
    </div>
    <div style="background:linear-gradient(135deg,#dbeafe,#bfdbfe);border:3px solid #1d4ed8;padding:20px;margin:15px 0;text-align:center;border-radius:10px;">
        <p style="font-size:15pt;font-weight:bold;color:#1d4ed8;line-height:1.8;margin:0;">${finalTitle}</p>
    </div>

    <div style="background:#1d4ed8;color:white;padding:10px 15px;margin:20px 0 10px 0;border-radius:5px;">
        <h3 style="font-size:13pt;margin:0;font-weight:bold;">IV. TELAAH KELAYAKAN AKADEMIS</h3>
    </div>
    ${scoreText}

    <div style="background:#1d4ed8;color:white;padding:10px 15px;margin:20px 0 10px 0;border-radius:5px;">
        <h3 style="font-size:13pt;margin:0;font-weight:bold;">V. KERANGKA PENELITIAN</h3>
    </div>
    ${logicSection}

    <div style="background:#1d4ed8;color:white;padding:10px 15px;margin:20px 0 10px 0;border-radius:5px;">
        <h3 style="font-size:13pt;margin:0;font-weight:bold;">VI. RENCANA PELAKSANAAN</h3>
    </div>
    <p style="margin:10px 0;font-weight:bold;color:#1d4ed8;">A. Pengumpulan Data:</p>
    ${dataSteps}
    <p style="margin:10px 0;font-weight:bold;color:#1d4ed8;">B. Analisis Data:</p>
    ${anaSteps}
    <p style="margin:10px 0;font-weight:bold;color:#1d4ed8;">C. Pertanyaan untuk Dosen Pembimbing:</p>
    ${supQuestions}

    <div style="background:#1d4ed8;color:white;padding:10px 15px;margin:20px 0 10px 0;border-radius:5px;">
        <h3 style="font-size:13pt;margin:0;font-weight:bold;">VII. ANALISIS JUDUL (5W + 1H)</h3>
    </div>
    ${analysis5W1H}

    <div style="background:#1d4ed8;color:white;padding:10px 15px;margin:20px 0 10px 0;border-radius:5px;">
        <h3 style="font-size:13pt;margin:0;font-weight:bold;">VIII. INSTRUMEN RISET</h3>
    </div>
    <p style="margin:10px 0;text-align:justify;">${inst.replace(/\n/g, '<br>')}</p>

    <div style="page-break-before:always;"></div>
    <div style="background:#1d4ed8;color:white;padding:10px 15px;margin:20px 0 10px 0;border-radius:5px;">
        <h3 style="font-size:13pt;margin:0;font-weight:bold;">LAMPIRAN: OPSI JUDUL ALTERNATIF</h3>
    </div>
    ${optionList}

    <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:2px solid #1d4ed8;color:#6b7280;">
        <p style="margin:5px 0;font-weight:bold;">Dokumen ini digenerate oleh Dosbing.ai</p>
        <p style="margin:5px 0;">AI-Powered Research Title Generator</p>
        <p style="margin:5px 0;font-size:10pt;">Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
</body>
</html>`;

    const converted = htmlDocx.asBlob(content, { orientation: 'portrait', margins: { top: 720, right: 720, bottom: 720, left: 720 } });
    saveAs(converted, `Deskripsi_Judul_${userData.nama.replace(/\s+/g, '_')}_${new Date().getTime()}.docx`);
}

window.finishSession = function () {
    downloadDocx();
    document.getElementById('success-modal').classList.add('active');

    // Auto-logout after 3 seconds
    setTimeout(() => {
        clearSession();
        sessionStorage.removeItem('dosbing_session');
        alert('🎉 Dokumen berhasil diunduh! Sesi akan berakhir.');
        window.location.href = '/';
    }, 3000);
};

console.log('✅ Dosbing.ai Research Generator v3 initialized (Secure Mode)');
