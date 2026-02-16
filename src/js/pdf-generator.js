// =============================================
// PDF Generator for Dosbing.ai Research Report
// v2 - Complete Overhaul
// =============================================

// Helper: clean special characters for PDF text
function pdfClean(text) {
    if (!text) return '-';
    return text
        .replace(/[*#_`]/g, '')
        .replace(/\$([a-zA-Z0-9_]+)\$/g, '$1')
        .replace(/[\u{1F4CB}\u{1F4CA}\u{2753}\u{1F527}\u{2728}\u{1F4C8}]/gu, '') // remove emoji
        .replace(/[^\x20-\x7E\u00C0-\u024F\u1E00-\u1EFF\u0100-\u017F\n]/g, '') // keep latin + newlines
        .replace(/\s+/g, ' ')
        .trim() || '-';
}

// Helper: Title Case with abbreviation detection
// - Capitalizes first letter of each word
// - Keeps known abbreviations ALL CAPS (PT, CV, UMKM, S1, etc.)
// - Keeps connector words lowercase (dan, di, ke, dari, atau)
function toTitleCase(text) {
    if (!text || text === '-') return text;
    var abbrevPatterns = /^(pt|cv|ud|tb|tbk|umkm|ukm|bumn|bumd|bpjs|pns|tni|polri|ri|ui|ugm|itb|its|ipb|unair|undip|uns|upi|unpad|unj|usu|unhas|um|uny|ub|unsri|unri|uin|iain|stmik|stie|stikes|stkip|smk|sma|smp|sd|mi|mts|ma|s1|s2|s3|d3|d4|it|hr|ai|rnd|r&d|spss|sem|anova|csr|crm|erp|hrd|sdm|kpi|roi|swot|gis|sda|ict|atm|bpr|bpd|ojk|bi|bps|dprd|dpr|mpr|kemendikbud|kemenristekdikti|kementerian|pdam|pltu|plta|pln|bri|bni|bca|btn|bsi|mandiri|bss|bmri)$/i;
    var connectors = /^(dan|di|ke|dari|atau|yang|untuk|pada|dengan|dalam|oleh|antara|terhadap|melalui|sebagai|secara|tentang|atas|tanpa|hingga|sampai|serta|maupun|namun|tetapi|akan|telah|sudah|belum|juga|pun|per|vs)$/i;

    return pdfClean(text).split(' ').map(function (word, idx) {
        if (!word) return word;
        // Check if word matches abbreviation pattern
        if (abbrevPatterns.test(word)) return word.toUpperCase();
        // Check for patterns like 2-4 char all-consonant or mixed with digits → treat as abbreviation
        if (/^[A-Za-z0-9&]{1,5}$/.test(word) && /[0-9]/.test(word) && /[A-Za-z]/.test(word)) return word.toUpperCase();
        // Connector words stay lowercase except at start
        if (idx > 0 && connectors.test(word)) return word.toLowerCase();
        // Title case: capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
}

window.downloadPDF = async function () {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Brand colors matching dosbing.ai web
        const colors = {
            headerLeft: [29, 78, 216],     // #1D4ED8 blue
            headerRight: [16, 185, 129],   // #10B981 green
            logoText: [255, 255, 255],     // white for logo on header
            sectionTitle: [16, 185, 129],  // green - brand Dosbing.ai
            textDark: [15, 23, 42],        // #0F172A
            textMuted: [100, 116, 139],    // #64748B
            bgLight: [248, 250, 252],      // #F8FAFC
            bgCard: [241, 245, 249],       // #F1F5F9
            white: [255, 255, 255],
            green: [16, 185, 129],
            red: [239, 68, 68],
            yellow: [234, 179, 8],
            border: [203, 213, 225]        // #CBD5E1
        };

        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
        const contentWidth = pageWidth - 2 * margin;
        let currentPage = 1;

        // Helper: draw cover header - soft neutral gradient for logo contrast
        function drawCoverHeader(height) {
            for (let i = 0; i < height; i++) {
                const t = i / height;
                // Light warm gray (#F1F5F9) to white (#FFFFFF)
                const r = 241 + (255 - 241) * t;
                const g = 245 + (255 - 245) * t;
                const b = 249 + (255 - 249) * t;
                doc.setFillColor(r, g, b);
                doc.rect(0, i, pageWidth, 1, 'F');
            }
            // Thin accent line at bottom of header
            doc.setDrawColor(29, 78, 216);
            doc.setLineWidth(0.8);
            doc.line(margin, height, pageWidth - margin, height);
        }

        // Helper: draw page header for content pages
        function drawPageHeader(title) {
            doc.setFillColor(...colors.headerLeft);
            doc.rect(0, 0, pageWidth, 12, 'F');
            doc.setTextColor(...colors.white);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(title, margin, 8);
        }

        // Helper: draw page footer
        function drawFooter() {
            doc.setFontSize(7);
            doc.setTextColor(...colors.textMuted);
            doc.text('Dosbing.ai - Teman Bimbingan Cerdas', margin, pageHeight - 8);
            doc.text('Halaman ' + currentPage, pageWidth - margin, pageHeight - 8, { align: 'right' });
        }

        // Helper: section title
        function sectionTitle(text, y) {
            doc.setTextColor(...colors.sectionTitle);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(text, margin, y);
            return y + 5;
        }

        // Helper: draw labeled content in compact card
        function drawInfoRow(label, value, y, fontSize) {
            fontSize = fontSize || 8;
            doc.setTextColor(...colors.textMuted);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text(label, margin + 3, y);
            doc.setTextColor(...colors.textDark);
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(pdfClean(value), contentWidth - 6);
            doc.text(lines, margin + 3, y + 4);
            return y + 4 + lines.length * (fontSize * 0.4) + 2;
        }

        // ===================================
        // PAGE 1: COVER + ALL INPUT DATA
        // ===================================

        // Header - light neutral background
        drawCoverHeader(30);

        // Logo text - 'Dosbing' in blue, '.ai' in green (matching web)
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        var logoFullWidth = doc.getTextWidth('Dosbing.ai');
        var logoStartX = (pageWidth - logoFullWidth) / 2;
        var dosbingWidth = doc.getTextWidth('Dosbing');
        doc.setTextColor(29, 78, 216); // blue #1D4ED8
        doc.text('Dosbing', logoStartX, 14);
        doc.setTextColor(16, 185, 129); // green #10B981
        doc.text('.ai', logoStartX + dosbingWidth, 14);

        doc.setTextColor(...colors.textDark);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Teman Bimbingan Cerdas, Kapan Saja', pageWidth / 2, 20, { align: 'center' });

        doc.setTextColor(...colors.textDark);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Deskripsi Judul Skripsi', pageWidth / 2, 27, { align: 'center' });

        // Get all Step 1 data
        const studentName = sessionStorage.getItem('studentName') || '-';
        const gender = sessionStorage.getItem('gender') || '-';
        const jurusan = sessionStorage.getItem('jurusan') || '-';
        const fakultas = sessionStorage.getItem('fakultas') || '-';
        const university = sessionStorage.getItem('university') || '-';
        const minat = sessionStorage.getItem('minat') || '-';

        // Get Step 2-5 data
        const objek = sessionStorage.getItem('objek') || '-';
        const masalah = sessionStorage.getItem('masalah') || '-';
        const metode = sessionStorage.getItem('metode') || '-';
        const connectionAnalysis = sessionStorage.getItem('connectionAnalysis') || '';

        let yPos = 37;

        // --- DATA MAHASISWA ---
        yPos = sectionTitle('DATA MAHASISWA', yPos);

        doc.setFillColor(...colors.bgLight);
        doc.roundedRect(margin, yPos, contentWidth, 28, 2, 2, 'F');
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, yPos, contentWidth, 28, 2, 2, 'S');

        // Row 1: Name & Gender
        doc.setTextColor(...colors.textDark);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(toTitleCase(studentName), margin + 3, yPos + 6);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textMuted);
        doc.text('Gender: ' + toTitleCase(gender), margin + 3, yPos + 12);
        doc.text('Program Studi: ' + toTitleCase(jurusan), margin + 3, yPos + 17);
        doc.text('Fakultas: ' + toTitleCase(fakultas), contentWidth / 2 + margin, yPos + 12);
        doc.text('Perguruan Tinggi: ' + toTitleCase(university), contentWidth / 2 + margin, yPos + 17);
        doc.text('Minat/Konsentrasi: ' + toTitleCase(minat), margin + 3, yPos + 22);

        yPos += 33;

        // --- OBJEK PENELITIAN ---
        yPos = sectionTitle('OBJEK PENELITIAN', yPos);
        doc.setFillColor(...colors.bgCard);
        const objekLines = doc.splitTextToSize(pdfClean(objek), contentWidth - 6);
        const objekH = Math.max(10, objekLines.length * 4 + 6);
        doc.roundedRect(margin, yPos, contentWidth, objekH, 2, 2, 'F');
        doc.setTextColor(...colors.textDark);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(objekLines, margin + 3, yPos + 4);
        yPos += objekH + 4;

        // --- MASALAH PENELITIAN ---
        yPos = sectionTitle('MASALAH PENELITIAN', yPos);
        doc.setFillColor(...colors.bgCard);
        const masalahLines = doc.splitTextToSize(pdfClean(masalah), contentWidth - 6);
        const masalahH = Math.max(10, masalahLines.length * 4 + 6);
        doc.roundedRect(margin, yPos, contentWidth, masalahH, 2, 2, 'F');
        doc.setTextColor(...colors.textDark);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(masalahLines, margin + 3, yPos + 4);
        yPos += masalahH + 4;

        // --- HASIL ANALISIS KAITAN (Step 4) ---
        if (connectionAnalysis) {
            yPos = sectionTitle('HASIL VALIDASI KAITAN', yPos);
            doc.setFillColor(...colors.bgCard);
            const kaitanLines = doc.splitTextToSize(pdfClean(connectionAnalysis), contentWidth - 6);
            const kaitanH = Math.max(10, kaitanLines.length * 4 + 6);
            doc.roundedRect(margin, yPos, contentWidth, kaitanH, 2, 2, 'F');
            doc.setTextColor(...colors.textDark);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(kaitanLines, margin + 3, yPos + 4);
            yPos += kaitanH + 4;
        }

        // --- METODE PENELITIAN ---
        yPos = sectionTitle('METODE PENELITIAN', yPos);
        var metodeDesc = '';
        var metodeClean = pdfClean(metode);
        if (metodeClean.toLowerCase().indexOf('kuantitatif') >= 0) {
            metodeDesc = 'Pendekatan kuantitatif menggunakan data numerik dan analisis statistik untuk menguji hipotesis, mengukur variabel, dan menentukan hubungan kausal antar variabel penelitian secara objektif dan terukur.';
        } else if (metodeClean.toLowerCase().indexOf('kualitatif') >= 0) {
            metodeDesc = 'Pendekatan kualitatif menggunakan data deskriptif (wawancara, observasi, dokumen) untuk memahami fenomena secara mendalam, mengeksplorasi makna, dan menghasilkan teori berbasis temuan lapangan.';
        } else if (metodeClean.toLowerCase().indexOf('r&d') >= 0 || metodeClean.toLowerCase().indexOf('r & d') >= 0) {
            metodeDesc = 'Pendekatan Research & Development (R&D) bertujuan menghasilkan produk/model tertentu melalui tahapan penelitian dan pengembangan yang sistematis, kemudian menguji efektivitas produk tersebut.';
        } else {
            metodeDesc = 'Metode penelitian yang dipilih untuk menjawab rumusan masalah dan mencapai tujuan penelitian.';
        }
        doc.setFillColor(...colors.bgCard);
        var metodeDescLines = doc.splitTextToSize(metodeDesc, contentWidth - 6);
        var metodeBoxH = Math.max(16, metodeDescLines.length * 3.5 + 14);
        doc.roundedRect(margin, yPos, contentWidth, metodeBoxH, 2, 2, 'F');
        doc.setTextColor(...colors.textDark);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(metodeClean, margin + 3, yPos + 6);
        doc.setTextColor(...colors.textMuted);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(metodeDescLines, margin + 3, yPos + 11);
        yPos += metodeBoxH + 4;

        // Date
        const today = new Date().toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        doc.setFontSize(7);
        doc.setTextColor(...colors.textMuted);
        doc.text('Dibuat: ' + today, pageWidth / 2, pageHeight - 15, { align: 'center' });

        drawFooter();

        // ===================================
        // PAGE 2+: REKOMENDASI JUDUL (FULL)
        // ===================================
        doc.addPage();
        currentPage++;
        drawPageHeader('REKOMENDASI JUDUL');

        yPos = 18;

        var generatedPaths = [];
        try { generatedPaths = JSON.parse(sessionStorage.getItem('generatedPaths') || '[]'); } catch (e) { generatedPaths = []; }
        var generatedTitles = [];
        try { generatedTitles = JSON.parse(sessionStorage.getItem('generatedTitles') || '[]'); } catch (e) { generatedTitles = []; }

        if (generatedPaths.length > 0) {
            // Full format with topic, phenomenon, analysis
            generatedPaths.forEach(function (path, pathIdx) {
                if (yPos > 240) {
                    drawFooter();
                    doc.addPage();
                    currentPage++;
                    drawPageHeader('REKOMENDASI JUDUL (lanjutan)');
                    yPos = 18;
                }

                // Theme header
                doc.setFillColor(...colors.headerLeft);
                doc.roundedRect(margin, yPos, contentWidth, 8, 2, 2, 'F');
                doc.setTextColor(...colors.white);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text('TEMA ' + (pathIdx + 1) + ': ' + pdfClean(path.topic || '').toUpperCase(), margin + 3, yPos + 5.5);
                yPos += 11;

                // Phenomenon
                if (path.phenomenon) {
                    doc.setTextColor(...colors.sectionTitle);
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Fenomena:', margin, yPos);
                    yPos += 3.5;
                    doc.setTextColor(...colors.textDark);
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    var phenomLines = doc.splitTextToSize(pdfClean(path.phenomenon), contentWidth - 4);
                    doc.text(phenomLines, margin + 2, yPos);
                    yPos += phenomLines.length * 3 + 3;
                }

                // Analysis technique
                if (path.analysis) {
                    doc.setTextColor(...colors.sectionTitle);
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Teknik Analisis:', margin, yPos);
                    yPos += 3.5;
                    doc.setTextColor(...colors.textDark);
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    var analysisLines = doc.splitTextToSize(pdfClean(path.analysis), contentWidth - 4);
                    doc.text(analysisLines, margin + 2, yPos);
                    yPos += analysisLines.length * 3 + 3;
                }

                // Titles for this theme
                if (path.titles && Array.isArray(path.titles)) {
                    doc.setTextColor(...colors.sectionTitle);
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Judul Rekomendasi:', margin, yPos);
                    yPos += 4;

                    path.titles.forEach(function (title, titleIdx) {
                        if (yPos > 270) {
                            drawFooter();
                            doc.addPage();
                            currentPage++;
                            drawPageHeader('REKOMENDASI JUDUL (lanjutan)');
                            yPos = 18;
                        }

                        doc.setFillColor(...colors.bgLight);
                        var titleClean = pdfClean(title);
                        var titleLines = doc.splitTextToSize(titleClean, contentWidth - 14);
                        var boxH = Math.max(10, titleLines.length * 3.5 + 6);
                        doc.roundedRect(margin + 2, yPos, contentWidth - 4, boxH, 1, 1, 'F');

                        doc.setTextColor(...colors.green);
                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'bold');
                        doc.text((titleIdx + 1) + '.', margin + 4, yPos + 4);

                        doc.setTextColor(...colors.textDark);
                        doc.setFontSize(7.5);
                        doc.setFont('helvetica', 'normal');
                        doc.text(titleLines, margin + 8, yPos + 4);

                        yPos += boxH + 2;
                    });
                }
                yPos += 4;
            });
        } else if (generatedTitles.length > 0) {
            // Fallback: flat title list
            generatedTitles.forEach(function (title, index) {
                if (yPos > 270) {
                    drawFooter();
                    doc.addPage();
                    currentPage++;
                    drawPageHeader('REKOMENDASI JUDUL (lanjutan)');
                    yPos = 18;
                }
                doc.setFillColor(...colors.bgLight);
                var titleClean = pdfClean(title);
                var titleLines = doc.splitTextToSize(titleClean, contentWidth - 10);
                var boxH = Math.max(12, titleLines.length * 3.5 + 8);
                doc.roundedRect(margin, yPos, contentWidth, boxH, 2, 2, 'F');
                doc.setTextColor(...colors.green);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.text('Opsi ' + (index + 1), margin + 3, yPos + 4);
                doc.setTextColor(...colors.textDark);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(titleLines, margin + 3, yPos + 9);
                yPos += boxH + 2;
            });
        } else {
            doc.setTextColor(...colors.textMuted);
            doc.setFontSize(9);
            doc.text('Tidak ada rekomendasi judul tersimpan.', margin, yPos + 5);
        }

        drawFooter();

        // ===================================
        // PAGE 3: JUDUL FINAL + TELAAH LENGKAP
        // ===================================
        doc.addPage();
        currentPage++;
        drawPageHeader('JUDUL FINAL & HASIL TELAAH');

        yPos = 18;

        // Final Title
        const finalTitle = sessionStorage.getItem('finalTitle') || sessionStorage.getItem('standardizedTitle') || '-';
        doc.setFillColor(255, 250, 240);
        doc.setDrawColor(...colors.green);
        doc.setLineWidth(0.5);
        const ftLines = doc.splitTextToSize(pdfClean(finalTitle), contentWidth - 10);
        const ftH = Math.max(16, ftLines.length * 4.5 + 12);
        doc.roundedRect(margin, yPos, contentWidth, ftH, 2, 2, 'FD');

        doc.setTextColor(...colors.green);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('JUDUL TERPILIH', margin + 3, yPos + 5);

        doc.setTextColor(...colors.textDark);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(ftLines, margin + 3, yPos + 11);

        yPos += ftH + 6;

        // Analysis Data - 4 Pillars
        const analysisData = JSON.parse(sessionStorage.getItem('analysisData') || '{}');

        const pillars = [
            { key: 'necessity', label: 'Necessity (Urgensi)' },
            { key: 'novelty', label: 'Novelty (Kebaruan)' },
            { key: 'relevance', label: 'Relevance (Kesesuaian)' },
            { key: 'feasibility', label: 'Feasibility (Kelayakan)' }
        ];

        // Section: 4 Pilar Kelayakan
        yPos = sectionTitle('HASIL TELAAH - 4 PILAR KELAYAKAN', yPos);

        pillars.forEach(function (pillar) {
            const data = analysisData[pillar.key];
            if (!data) return;

            if (yPos > 255) {
                drawFooter();
                doc.addPage();
                currentPage++;
                drawPageHeader('HASIL TELAAH (lanjutan)');
                yPos = 18;
            }

            const score = data.score || 0;
            const reason = pdfClean(data.reason);
            const reasonLines = doc.splitTextToSize(reason, contentWidth - 50);
            const rowH = Math.max(12, reasonLines.length * 3.5 + 10);

            // Score bar background
            doc.setFillColor(...colors.bgLight);
            doc.roundedRect(margin, yPos, contentWidth, rowH, 2, 2, 'F');

            // Pillar label + score
            doc.setTextColor(...colors.textDark);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(pillar.label + ': ' + score + '%', margin + 3, yPos + 5);

            // Score bar
            const barX = margin + 3;
            const barY = yPos + 7;
            const barW = 40;
            doc.setFillColor(220, 220, 220);
            doc.rect(barX, barY, barW, 3, 'F');
            const barColor = score < 60 ? colors.red : score < 80 ? colors.yellow : colors.green;
            doc.setFillColor(...barColor);
            doc.rect(barX, barY, barW * (score / 100), 3, 'F');

            // Reason text
            doc.setTextColor(...colors.textMuted);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(reasonLines, margin + 48, yPos + 5);

            yPos += rowH + 2;
        });

        // Average score
        if (analysisData.necessity && analysisData.novelty && analysisData.relevance && analysisData.feasibility) {
            const scores = [
                analysisData.necessity.score || 0,
                analysisData.novelty.score || 0,
                analysisData.relevance.score || 0,
                analysisData.feasibility.score || 0
            ];
            const avg = Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / 4);

            doc.setFillColor(...colors.headerLeft);
            doc.roundedRect(margin, yPos, contentWidth, 8, 2, 2, 'F');
            doc.setTextColor(...colors.white);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Rata-rata Skor Kelayakan: ' + avg + '%', pageWidth / 2, yPos + 5.5, { align: 'center' });
            yPos += 12;
        }

        // Conclusion
        if (analysisData.conclusion) {
            if (yPos > 240) {
                drawFooter();
                doc.addPage();
                currentPage++;
                drawPageHeader('KESIMPULAN TELAAH');
                yPos = 18;
            }

            yPos = sectionTitle('KESIMPULAN TELAAH', yPos);
            doc.setFillColor(...colors.bgCard);
            const conclusionLines = doc.splitTextToSize(pdfClean(analysisData.conclusion), contentWidth - 6);
            const cH = Math.max(14, conclusionLines.length * 3.5 + 8);
            doc.roundedRect(margin, yPos, contentWidth, cH, 2, 2, 'F');
            doc.setTextColor(...colors.textDark);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(conclusionLines, margin + 3, yPos + 5);
            yPos += cH + 4;
        }

        drawFooter();

        // ===================================
        // PAGE 4: KERANGKA PENELITIAN
        // ===================================
        doc.addPage();
        currentPage++;
        drawPageHeader('KERANGKA PENELITIAN');

        yPos = 18;

        const kerangkaRaw = sessionStorage.getItem('kerangkaData');
        let kerangkaData = null;
        if (kerangkaRaw) {
            try { kerangkaData = JSON.parse(kerangkaRaw); } catch (e) { kerangkaData = null; }
        }

        if (kerangkaData && kerangkaData.sections && Array.isArray(kerangkaData.sections)) {
            kerangkaData.sections.forEach(function (section) {
                if (yPos > 255) {
                    drawFooter();
                    doc.addPage();
                    currentPage++;
                    drawPageHeader('KERANGKA PENELITIAN (lanjutan)');
                    yPos = 18;
                }

                // Section title
                doc.setTextColor(...colors.headerLeft);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text(pdfClean(section.title), margin, yPos);
                yPos += 5;

                // Section items
                if (section.items && Array.isArray(section.items)) {
                    section.items.forEach(function (item, idx) {
                        if (yPos > 270) {
                            drawFooter();
                            doc.addPage();
                            currentPage++;
                            drawPageHeader('KERANGKA PENELITIAN (lanjutan)');
                            yPos = 18;
                        }

                        const itemText = (idx + 1) + '. ' + pdfClean(item);
                        const itemLines = doc.splitTextToSize(itemText, contentWidth - 8);
                        doc.setTextColor(...colors.textDark);
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'normal');
                        doc.text(itemLines, margin + 4, yPos);
                        yPos += itemLines.length * 3.5 + 2;
                    });
                }
                yPos += 4;
            });
        } else if (kerangkaData && kerangkaData.framework) {
            // Fallback for old format
            const fwLines = doc.splitTextToSize(pdfClean(kerangkaData.framework), contentWidth);
            doc.setTextColor(...colors.textDark);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(fwLines, margin, yPos);
        } else {
            doc.setTextColor(...colors.textMuted);
            doc.setFontSize(9);
            doc.text('Kerangka penelitian belum tersedia.', margin, yPos + 5);
            doc.setFontSize(8);
            doc.text('Pastikan Anda telah menyelesaikan Step 10 sebelum mengunduh PDF.', margin, yPos + 11);
        }

        drawFooter();

        // ===================================
        // PAGE 5: DATA & PERTANYAAN (Action Plan)
        // ===================================
        doc.addPage();
        currentPage++;
        drawPageHeader('ACTION PLAN - DATA & PERTANYAAN');

        yPos = 18;

        // Data requirements
        const dataRequirementsRaw = sessionStorage.getItem('dataRequirements');
        let dataRequirements = [];
        if (dataRequirementsRaw) {
            try { dataRequirements = JSON.parse(dataRequirementsRaw); } catch (e) { dataRequirements = []; }
        }

        if (dataRequirements.length > 0) {
            yPos = sectionTitle('KEBUTUHAN DATA', yPos);
            dataRequirements.forEach(function (item, index) {
                if (yPos > 270) {
                    drawFooter();
                    doc.addPage();
                    currentPage++;
                    drawPageHeader('ACTION PLAN (lanjutan)');
                    yPos = 18;
                }
                const itemText = (index + 1) + '. ' + pdfClean(item);
                const lines = doc.splitTextToSize(itemText, contentWidth - 4);
                doc.setTextColor(...colors.textDark);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(lines, margin + 2, yPos);
                yPos += lines.length * 3.5 + 2;
            });
            yPos += 4;
        }

        // Data analysis
        const dataAnalysisRaw = sessionStorage.getItem('dataAnalysis');
        let dataAnalysis = [];
        if (dataAnalysisRaw) {
            try { dataAnalysis = JSON.parse(dataAnalysisRaw); } catch (e) { dataAnalysis = []; }
        }

        if (dataAnalysis.length > 0) {
            if (yPos > 230) {
                drawFooter();
                doc.addPage();
                currentPage++;
                drawPageHeader('ACTION PLAN (lanjutan)');
                yPos = 18;
            }
            yPos = sectionTitle('ANALISIS DATA', yPos);
            dataAnalysis.forEach(function (item, index) {
                if (yPos > 270) {
                    drawFooter();
                    doc.addPage();
                    currentPage++;
                    drawPageHeader('ACTION PLAN (lanjutan)');
                    yPos = 18;
                }
                const itemText = (index + 1) + '. ' + pdfClean(item);
                const lines = doc.splitTextToSize(itemText, contentWidth - 4);
                doc.setTextColor(...colors.textDark);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(lines, margin + 2, yPos);
                yPos += lines.length * 3.5 + 2;
            });
            yPos += 4;
        }

        // Questions for supervisor
        const questionsRaw = sessionStorage.getItem('questions');
        let questions = [];
        if (questionsRaw) {
            try { questions = JSON.parse(questionsRaw); } catch (e) { questions = []; }
        }

        if (questions.length > 0) {
            if (yPos > 220) {
                drawFooter();
                doc.addPage();
                currentPage++;
                drawPageHeader('ACTION PLAN (lanjutan)');
                yPos = 18;
            }
            yPos = sectionTitle('PERTANYAAN UNTUK DOSEN PEMBIMBING', yPos);
            questions.forEach(function (item, index) {
                if (yPos > 270) {
                    drawFooter();
                    doc.addPage();
                    currentPage++;
                    drawPageHeader('ACTION PLAN (lanjutan)');
                    yPos = 18;
                }
                const itemText = (index + 1) + '. ' + pdfClean(item);
                const lines = doc.splitTextToSize(itemText, contentWidth - 4);
                doc.setTextColor(...colors.textDark);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(lines, margin + 2, yPos);
                yPos += lines.length * 3.5 + 2;
            });
            yPos += 4;
        }

        drawFooter();

        // ===================================
        // PAGE 6: 5W+1H & INSTRUMEN
        // ===================================
        doc.addPage();
        currentPage++;
        drawPageHeader('ANALISIS 5W+1H & INSTRUMEN PENELITIAN');

        yPos = 18;

        // 5W+1H
        const fiveWOneHRaw = sessionStorage.getItem('fiveWOneH');
        let fiveWOneH = [];
        if (fiveWOneHRaw) {
            try { fiveWOneH = JSON.parse(fiveWOneHRaw); } catch (e) { fiveWOneH = []; }
        }

        if (fiveWOneH.length > 0) {
            yPos = sectionTitle('ANALISIS 5W+1H', yPos);
            fiveWOneH.forEach(function (item) {
                if (yPos > 265) {
                    drawFooter();
                    doc.addPage();
                    currentPage++;
                    drawPageHeader('ANALISIS 5W+1H (lanjutan)');
                    yPos = 18;
                }

                const cleanItem = pdfClean(item);
                const colonIdx = cleanItem.indexOf(':');
                let label = cleanItem;
                let content = '';
                if (colonIdx > 0) {
                    label = cleanItem.substring(0, colonIdx).trim();
                    content = cleanItem.substring(colonIdx + 1).trim();
                }

                doc.setTextColor(...colors.green);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text(label + ':', margin, yPos);

                doc.setTextColor(...colors.textDark);
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'normal');
                const contentLines = doc.splitTextToSize(content, contentWidth - 4);
                doc.text(contentLines, margin + 2, yPos + 4);
                yPos += 4 + contentLines.length * 3.5 + 3;
            });
            yPos += 3;
        }

        // Instruments
        const instrumentsRaw = sessionStorage.getItem('instruments');
        let instruments = [];
        if (instrumentsRaw) {
            try { instruments = JSON.parse(instrumentsRaw); } catch (e) { instruments = []; }
        }

        if (instruments.length > 0) {
            if (yPos > 200) {
                drawFooter();
                doc.addPage();
                currentPage++;
                drawPageHeader('INSTRUMEN PENELITIAN');
                yPos = 18;
            }
            yPos = sectionTitle('INSTRUMEN PENELITIAN', yPos);
            instruments.forEach(function (item, index) {
                if (yPos > 270) {
                    drawFooter();
                    doc.addPage();
                    currentPage++;
                    drawPageHeader('INSTRUMEN PENELITIAN (lanjutan)');
                    yPos = 18;
                }
                const itemText = (index + 1) + '. ' + pdfClean(item);
                const lines = doc.splitTextToSize(itemText, contentWidth - 4);
                doc.setTextColor(...colors.textDark);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(lines, margin + 2, yPos);
                yPos += lines.length * 3.5 + 2;
            });
        }

        // Final footer with branding
        doc.setFillColor(...colors.bgLight);
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        doc.setTextColor(...colors.headerLeft);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Powered by Dosbing.ai', pageWidth / 2, pageHeight - 12, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textMuted);
        doc.text('Teman Bimbingan Cerdas, Kapan Saja', pageWidth / 2, pageHeight - 8, { align: 'center' });

        drawFooter();

        // Save PDF
        const safeName = pdfClean(studentName).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const fileName = 'Deskripsi_Judul_Skripsi_' + safeName + '.pdf';
        doc.save(fileName);

        // Show success modal & auto-logout (same as old docx flow)
        var successModal = document.getElementById('success-modal');
        if (successModal) successModal.classList.add('active');

        setTimeout(function () {
            if (typeof clearSession === 'function') clearSession();
            sessionStorage.removeItem('dosbing_session');
            alert('🎉 PDF berhasil diunduh! Sesi akan berakhir.');
            window.location.href = '/';
        }, 3000);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Gagal membuat PDF: ' + error.message + '\nSilakan coba lagi.');
    }
};
