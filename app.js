// ==========================================
// FLASHCARD APP - MAIN APPLICATION
// ==========================================

// Sample vocabulary data
const sampleVocabulary = [
    { word: 'Apple', phonetic: '/ˈæp.əl/', meaning: 'Quả táo', exampleEn: 'I eat an apple every day.', exampleVi: 'Tôi ăn một quả táo mỗi ngày.', category: 'fruits' },
    { word: 'Banana', phonetic: '/bəˈnæn.ə/', meaning: 'Quả chuối', exampleEn: 'Bananas are yellow fruit.', exampleVi: 'Chuối là loại quả màu vàng.', category: 'fruits' },
    { word: 'Cat', phonetic: '/kæt/', meaning: 'Con mèo', exampleEn: 'The cat is sleeping.', exampleVi: 'Con mèo đang ngủ.', category: 'animals' },
    { word: 'Dog', phonetic: '/dɔːɡ/', meaning: 'Con chó', exampleEn: 'Dogs are loyal animals.', exampleVi: 'Chó là động vật trung thành.', category: 'animals' },
    { word: 'Tree', phonetic: '/triː/', meaning: 'Cây', exampleEn: 'There is a big tree.', exampleVi: 'Có một cây lớn.', category: 'nature' },
    { word: 'Book', phonetic: '/bʊk/', meaning: 'Quyển sách', exampleEn: 'I love reading books.', exampleVi: 'Tôi thích đọc sách.', category: 'objects' },
];

// App State
let flashcards = [];
let currentStudyIndex = 0;
let quizScore = 0;
let quizTimer = null;
let quizSeconds = 0;
let currentEditId = null;
let uploadedImages = [];
let cardIdCounter = 0; // Counter for unique IDs
let batchCounter = 0; // Counter for JSON import batches

// Check if a word already exists in flashcards (case-insensitive)
function isWordDuplicate(word) {
    const normalizedWord = word.toLowerCase().trim();
    return flashcards.some(card =>
        card.vocabulary.word.toLowerCase().trim() === normalizedWord
    );
}

// DOM Elements
const elements = {
    uploadArea: document.getElementById('uploadArea'),
    uploadBtn: document.getElementById('uploadBtn'),
    fileInput: document.getElementById('fileInput'),
    uploadPreview: document.getElementById('uploadPreview'),
    flashcardGrid: document.getElementById('flashcardGrid'),
    emptyState: document.getElementById('emptyState'),
    totalCards: document.getElementById('totalCards'),
    learnedCards: document.getElementById('learnedCards'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    modeSections: document.querySelectorAll('.mode-section'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    categoryFilter: document.getElementById('categoryFilter'),
    // Study Mode
    studyCard: document.getElementById('studyCard'),
    studyWord: document.getElementById('studyWord'),
    studyWordType: document.getElementById('studyWordType'),
    studyPhonetic: document.getElementById('studyPhonetic'),
    studyMeaning: document.getElementById('studyMeaning'),
    studyProgress: document.getElementById('studyProgress'),
    studyProgressText: document.getElementById('studyProgressText'),
    prevCardBtn: document.getElementById('prevCardBtn'),
    nextCardBtn: document.getElementById('nextCardBtn'),
    speakBtn: document.getElementById('speakBtn'),
    // Quiz Mode
    quizOptions: document.getElementById('quizOptions'),
    quizScore: document.getElementById('quizScore'),
    quizTimer: document.getElementById('quizTimer'),
    quizResult: document.getElementById('quizResult'),
    quizCategoryFilter: document.getElementById('quizCategoryFilter'),
    // Modal
    modal: document.getElementById('addCardModal'),
    closeModal: document.getElementById('closeModal'),
    cancelModal: document.getElementById('cancelModal'),
    saveCard: document.getElementById('saveCard'),
    modalPreviewImage: document.getElementById('modalPreviewImage'),
    inputWord: document.getElementById('inputWord'),
    inputPhonetic: document.getElementById('inputPhonetic'),
    inputMeaning: document.getElementById('inputMeaning'),
    inputExampleEn: document.getElementById('inputExampleEn'),
    inputExampleVi: document.getElementById('inputExampleVi'),
    inputCategory: document.getElementById('inputCategory'),
    // Text Input
    inputTabBtns: document.querySelectorAll('.input-tab-btn'),
    textInputMode: document.getElementById('textInputMode'),
    pdfInputMode: document.getElementById('pdfInputMode'),
    vocabTextInput: document.getElementById('vocabTextInput'),
    createCardsBtn: document.getElementById('createCardsBtn'),
    clearTextBtn: document.getElementById('clearTextBtn'),
    jsonFileInput: document.getElementById('jsonFileInput'),
    loadJsonBtn: document.getElementById('loadJsonBtn'),
    // Study Category Filter
    studyCategoryFilter: document.getElementById('studyCategoryFilter'),
};

// Initialize App
async function init() {
    loadFromLocalStorage();
    loadBatchCounter();
    loadLoadedJsonFiles();

    // Always check for new JSON files
    await loadNewJsonFiles();

    setupEventListeners();
    updateCategoryFilter();
    renderFlashcards();
    updateStats();
}

// Track which JSON files have been loaded
let loadedJsonFiles = [];

function loadLoadedJsonFiles() {
    const saved = localStorage.getItem('loadedJsonFiles');
    if (saved) loadedJsonFiles = JSON.parse(saved);
}

function saveLoadedJsonFiles() {
    localStorage.setItem('loadedJsonFiles', JSON.stringify(loadedJsonFiles));
}

// Load only NEW JSON files that haven't been loaded before
async function loadNewJsonFiles() {
    try {
        const indexResponse = await fetch('JSON/index.json');
        if (!indexResponse.ok) return;

        const indexData = await indexResponse.json();
        const jsonFiles = indexData.files || [];

        // Find files that haven't been loaded yet
        const newFiles = jsonFiles.filter(file => !loadedJsonFiles.includes(file));

        if (newFiles.length === 0) {
            console.log('No new JSON files to load');
            return;
        }

        console.log(`Found ${newFiles.length} new JSON files to load:`, newFiles);
        let totalAdded = 0;

        for (const fileName of newFiles) {
            try {
                const response = await fetch(`JSON/${fileName}`);
                if (!response.ok) continue;

                const jsonData = await response.json();
                if (!Array.isArray(jsonData) || jsonData.length === 0) continue;

                // Increment batch counter
                batchCounter++;
                const currentBatch = batchCounter;

                // Parse and create flashcards (skip duplicates)
                const vocabularies = parseVocabularyFromJSON(jsonData);
                let addedCount = 0;
                vocabularies.forEach((vocab, index) => {
                    if (!isWordDuplicate(vocab.word)) {
                        createFlashcardFromVocabSilent(vocab, null, index, currentBatch);
                        addedCount++;
                    }
                });

                // Mark file as loaded
                loadedJsonFiles.push(fileName);
                totalAdded += addedCount;

                console.log(`Loaded ${addedCount}/${vocabularies.length} words from ${fileName} as Batch ${currentBatch}`);
            } catch (error) {
                console.log(`Could not load ${fileName}:`, error.message);
            }
        }

        // Save after loading
        if (totalAdded > 0) {
            saveToLocalStorage();
            saveBatchCounter();
            saveLoadedJsonFiles();
            console.log(`✅ Total: Added ${totalAdded} new words from ${newFiles.length} files`);
        }
    } catch (error) {
        console.log('Error loading new JSON files:', error.message);
    }
}

// Load default vocabulary from JSON files
async function loadDefaultVocabulary() {
    try {
        // Load list of JSON files from index.json
        const indexResponse = await fetch('JSON/index.json');
        if (!indexResponse.ok) {
            console.log('Could not load JSON/index.json');
            return;
        }

        const indexData = await indexResponse.json();
        const jsonFiles = indexData.files || [];

        if (jsonFiles.length === 0) {
            console.log('No JSON files listed in index.json');
            return;
        }

        for (let i = 0; i < jsonFiles.length; i++) {
            try {
                const response = await fetch(`JSON/${jsonFiles[i]}`);
                if (!response.ok) continue;

                const jsonData = await response.json();
                if (!Array.isArray(jsonData) || jsonData.length === 0) continue;

                // Increment batch counter
                batchCounter++;
                const currentBatch = batchCounter;

                // Parse and create flashcards (skip duplicates)
                const vocabularies = parseVocabularyFromJSON(jsonData);
                let addedCount = 0;
                vocabularies.forEach((vocab, index) => {
                    if (!isWordDuplicate(vocab.word)) {
                        createFlashcardFromVocabSilent(vocab, null, index, currentBatch);
                        addedCount++;
                    }
                });

                console.log(`Loaded ${addedCount}/${vocabularies.length} words from ${jsonFiles[i]} as Batch ${currentBatch} (${vocabularies.length - addedCount} duplicates skipped)`);
            } catch (error) {
                console.log(`Could not load ${jsonFiles[i]}:`, error.message);
            }
        }

        // Save after loading all defaults
        saveToLocalStorage();
        saveBatchCounter();
    } catch (error) {
        console.log('Error loading default vocabulary:', error.message);
    }
}

// Create flashcard without re-rendering (for bulk import)
function createFlashcardFromVocabSilent(vocab, imageData, index, batch = 1) {
    cardIdCounter++;
    const uniqueId = Date.now().toString() + '_' + cardIdCounter + '_' + index;

    const card = {
        id: uniqueId,
        imageUrl: imageData,
        vocabulary: {
            word: vocab.word,
            wordType: vocab.wordType || '',
            phonetic: vocab.phonetic || '',
            meaning: vocab.meaning,
            exampleEn: vocab.exampleEn || '',
            exampleVi: vocab.exampleVi || '',
        },
        batch: batch,
        isLearned: false,
        createdAt: new Date().toISOString(),
    };

    flashcards.push(card);
}

// Event Listeners
function setupEventListeners() {
    // Input Tab Switching
    elements.inputTabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchInputMode(btn.dataset.input));
    });

    // JSON Input
    elements.createCardsBtn.addEventListener('click', createCardsFromText);
    elements.clearTextBtn.addEventListener('click', () => {
        elements.vocabTextInput.value = '';
    });

    // JSON File Upload
    if (elements.loadJsonBtn && elements.jsonFileInput) {
        elements.loadJsonBtn.addEventListener('click', () => elements.jsonFileInput.click());
        elements.jsonFileInput.addEventListener('change', handleJsonFileUpload);
    }

    // Mode Tabs
    elements.tabBtns.forEach(btn => btn.addEventListener('click', () => switchMode(btn.dataset.mode)));

    // Browse Mode
    elements.shuffleBtn.addEventListener('click', shuffleCards);
    elements.categoryFilter.addEventListener('change', renderFlashcards);
    document.getElementById('deleteAllBtn').addEventListener('click', deleteAllCards);

    // Study Mode
    elements.studyCard.addEventListener('click', () => elements.studyCard.classList.toggle('flipped'));
    elements.prevCardBtn.addEventListener('click', () => navigateStudy(-1));
    elements.nextCardBtn.addEventListener('click', () => navigateStudy(1));
    elements.speakBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakWord();
    });
    document.querySelectorAll('.rating-btn').forEach(btn => btn.addEventListener('click', () => rateCard(btn.dataset.rating)));

    // Study Category Filter
    if (elements.studyCategoryFilter) {
        elements.studyCategoryFilter.addEventListener('change', initStudyMode);
    }

    // Quiz Category Filter - only update word count max, don't auto-start
    if (elements.quizCategoryFilter) {
        elements.quizCategoryFilter.addEventListener('change', updateQuizWordCountMax);
    }

    // Quiz Start Button
    const quizStartBtn = document.getElementById('quizStartBtn');
    if (quizStartBtn) {
        quizStartBtn.addEventListener('click', initQuizMode);
    }

    // Modal
    elements.closeModal.addEventListener('click', closeModal);
    elements.cancelModal.addEventListener('click', closeModal);
    elements.saveCard.addEventListener('click', saveCardFromModal);

}

// Switch Input Mode (Text / PDF)
function switchInputMode(mode) {
    elements.inputTabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.input === mode));
    if (elements.textInputMode) {
        elements.textInputMode.classList.toggle('active', mode === 'text');
    }
    if (elements.pdfInputMode) {
        elements.pdfInputMode.classList.toggle('active', mode === 'pdf');
    }
}

// Create Cards from JSON Input
function createCardsFromText() {
    const text = elements.vocabTextInput.value.trim();
    if (!text) {
        alert('Vui lòng nhập JSON từ vựng!');
        return;
    }

    try {
        const jsonData = JSON.parse(text);

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
            alert('JSON phải là một mảng chứa các từ vựng!');
            return;
        }

        // Increment batch counter for this import
        batchCounter++;
        const currentBatch = batchCounter;

        const vocabularies = parseVocabularyFromJSON(jsonData);

        if (vocabularies.length === 0) {
            batchCounter--; // Revert if no valid words
            alert('Không tìm thấy từ vựng hợp lệ trong JSON!');
            return;
        }

        // Create flashcard for each vocabulary with batch number (skip duplicates)
        let addedCount = 0;
        let duplicateCount = 0;
        vocabularies.forEach((vocab, index) => {
            if (!isWordDuplicate(vocab.word)) {
                createFlashcardFromVocab(vocab, null, index, currentBatch);
                addedCount++;
            } else {
                duplicateCount++;
            }
        });

        // Update category filter
        updateCategoryFilter();
        saveBatchCounter();

        // Clear input and show success
        elements.vocabTextInput.value = '';

        // Show result with duplicate info
        if (duplicateCount > 0) {
            alert(`✅ Đã tạo ${addedCount} thẻ flashcard vào Danh mục ${currentBatch}!\n⚠️ Bỏ qua ${duplicateCount} từ bị trùng lặp.`);
        } else {
            alert(`✅ Đã tạo thành công ${addedCount} thẻ flashcard vào Danh mục ${currentBatch}!`);
        }
    } catch (error) {
        console.error('JSON Parse Error:', error);
        alert('❌ Lỗi parse JSON! Vui lòng kiểm tra format:\n\n' + error.message);
    }
}

// Parse vocabulary from JSON array
function parseVocabularyFromJSON(jsonArray) {
    const vocabularies = [];

    for (const item of jsonArray) {
        // Validate required field
        if (!item.word || !item.definition) {
            continue;
        }

        vocabularies.push({
            word: item.word.trim(),
            wordType: item.partOfSpeech || '',
            phonetic: item.pronunciation || '',
            meaning: item.definition.trim(),
            exampleEn: item.exampleEn || '',
            exampleVi: item.exampleVi || '',
            category: item.category || 'objects'
        });
    }

    return vocabularies;
}

// Handle JSON file upload
function handleJsonFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        elements.vocabTextInput.value = event.target.result;
    };
    reader.readAsText(file);
    e.target.value = '';
}

// File Upload Handlers
function handleDragOver(e) {
    e.preventDefault();
    elements.uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    elements.uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    processFiles(files);
}

function handleFileSelect(e) {
    processFiles(e.target.files);
}

async function processFiles(files) {
    for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            const imageData = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });

            uploadedImages.push(imageData);
            showPreview(imageData);
        }
    }
}

function showPreview(imageData) {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    previewItem.innerHTML = `
        <img src="${imageData}" alt="Preview">
        <button class="remove-btn" onclick="this.parentElement.remove()">×</button>
    `;
    elements.uploadPreview.appendChild(previewItem);
}

// Parse vocabulary patterns from text
function parseVocabularyFromText(text) {
    const vocabularies = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
        // Skip header lines
        if (line.toLowerCase().includes('stt') || line.toLowerCase().includes('từ vựng') || line.toLowerCase().includes('nghĩa')) {
            continue;
        }

        // Try different separators: tab, multiple spaces, pipe
        let parts = null;

        // Tab separated (common in copied tables)
        if (line.includes('\t')) {
            parts = line.split('\t').map(p => p.trim()).filter(p => p);
        }
        // Pipe separated
        else if (line.includes('|')) {
            parts = line.split('|').map(p => p.trim()).filter(p => p);
        }
        // Multiple spaces (2+)
        else if (line.match(/\s{2,}/)) {
            parts = line.split(/\s{2,}/).map(p => p.trim()).filter(p => p);
        }

        if (parts && parts.length >= 2) {
            let word = '', wordType = '', phonetic = '', meaning = '';

            // Check if first part is a number (STT)
            const startsWithNumber = /^\d+\.?\s*/.test(parts[0]);
            const startIndex = startsWithNumber ? 1 : 0;

            if (startsWithNumber && parts.length === 1) continue;

            // Format: STT, Từ vựng, Từ loại, Phiên âm, Nghĩa (5 columns)
            // or: STT, Từ vựng, Từ loại, Nghĩa (4 columns)
            // or: Từ vựng, Từ loại, Nghĩa (3 columns)
            // or: Từ vựng, Nghĩa (2 columns)

            const effectiveParts = startsWithNumber ? parts.slice(1) : parts;

            if (effectiveParts.length >= 4) {
                // 4+ columns: word, type, phonetic, meaning
                word = effectiveParts[0];
                wordType = effectiveParts[1];
                phonetic = effectiveParts[2];
                meaning = effectiveParts.slice(3).join(' ');
            } else if (effectiveParts.length === 3) {
                // 3 columns: word, type, meaning OR word, phonetic, meaning
                word = effectiveParts[0];
                // Check if second part looks like phonetic (contains /)
                if (effectiveParts[1].includes('/')) {
                    phonetic = effectiveParts[1];
                    meaning = effectiveParts[2];
                } else {
                    wordType = effectiveParts[1];
                    meaning = effectiveParts[2];
                }
            } else if (effectiveParts.length === 2) {
                // 2 columns: word, meaning
                word = effectiveParts[0];
                meaning = effectiveParts[1];
            }

            // Clean up word - remove leading numbers
            word = word.replace(/^\d+\.?\s*/, '').trim();

            // Validate word
            if (word.length >= 2 && /[a-zA-Z]/.test(word)) {
                vocabularies.push({
                    word: word,
                    wordType: wordType,
                    phonetic: phonetic,
                    meaning: meaning,
                    exampleEn: '',
                    exampleVi: '',
                    category: 'objects'
                });
            }
        }
    }

    return vocabularies;
}

// Create flashcard from parsed vocabulary
function createFlashcardFromVocab(vocab, imageData, index, batch = 1) {
    cardIdCounter++;
    const uniqueId = Date.now().toString() + '_' + cardIdCounter + '_' + index;

    const card = {
        id: uniqueId,
        imageUrl: imageData,
        vocabulary: {
            word: vocab.word,
            wordType: vocab.wordType || '', // loại từ (n, v, adj, phr.v)
            phonetic: vocab.phonetic || '',
            meaning: vocab.meaning,
            exampleEn: vocab.exampleEn || '',
            exampleVi: vocab.exampleVi || '',
        },
        batch: batch, // Batch number for categorization
        isLearned: false,
        createdAt: new Date().toISOString(),
    };

    flashcards.push(card);
    saveToLocalStorage();
    renderFlashcards();
    updateStats();
}

// Create single card from image (fallback)
function createSingleCardFromImage(imageData) {
    const vocabIndex = flashcards.length % sampleVocabulary.length;
    const vocab = sampleVocabulary[vocabIndex];

    cardIdCounter++;
    const uniqueId = Date.now().toString() + '_' + cardIdCounter;

    const card = {
        id: uniqueId,
        imageUrl: imageData,
        vocabulary: {
            word: vocab.word,
            phonetic: vocab.phonetic,
            meaning: vocab.meaning,
            exampleEn: vocab.exampleEn,
            exampleVi: vocab.exampleVi,
        },
        category: vocab.category,
        isLearned: false,
        createdAt: new Date().toISOString(),
    };
    flashcards.push(card);
    saveToLocalStorage();
    renderFlashcards();
    updateStats();
}
// Update category filter dropdown based on existing batches
function updateCategoryFilter() {
    const batches = [...new Set(flashcards.map(c => c.batch).filter(b => b))].sort((a, b) => a - b);
    let options = '<option value="all">Tất cả danh mục</option>';
    batches.forEach(batch => {
        const count = flashcards.filter(c => c.batch === batch).length;
        options += `<option value="${batch}">📁 Danh mục ${batch} (${count} từ)</option>`;
    });

    // Update all category filters
    if (elements.categoryFilter) elements.categoryFilter.innerHTML = options;
    if (elements.studyCategoryFilter) elements.studyCategoryFilter.innerHTML = options;
    if (elements.quizCategoryFilter) elements.quizCategoryFilter.innerHTML = options;
}

// Save batch counter to localStorage
function saveBatchCounter() {
    localStorage.setItem('batchCounter', batchCounter.toString());
}

// Load batch counter from localStorage
function loadBatchCounter() {
    const saved = localStorage.getItem('batchCounter');
    if (saved) batchCounter = parseInt(saved) || 0;
}

// Render Flashcards
function renderFlashcards() {
    const filter = elements.categoryFilter.value;
    const filteredCards = filter === 'all'
        ? flashcards
        : flashcards.filter(c => c.batch === parseInt(filter));

    if (filteredCards.length === 0) {
        elements.emptyState.style.display = 'block';
        elements.flashcardGrid.innerHTML = '';
        elements.flashcardGrid.appendChild(elements.emptyState);
        return;
    }

    elements.emptyState.style.display = 'none';
    elements.flashcardGrid.innerHTML = filteredCards.map(card => {
        // Show phonetic if available
        const phoneticHtml = card.vocabulary.phonetic
            ? `<div class="phonetic">${card.vocabulary.phonetic}</div>`
            : '';

        // Show word type inline with word
        const wordTypeInline = card.vocabulary.wordType
            ? ` <span class="word-type-inline">(${card.vocabulary.wordType})</span>`
            : '';

        return `
        <div class="flashcard" data-id="${card.id}" onclick="toggleFlip(this)">
            ${card.isLearned ? '<span class="learned-badge">✓ Đã học</span>' : ''}
            <div class="card-actions">
                <button class="card-action-btn edit" onclick="event.stopPropagation(); openEditModal('${card.id}')">✏️</button>
                <button class="card-action-btn delete" onclick="event.stopPropagation(); deleteCard('${card.id}')">🗑️</button>
            </div>
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <div class="vocabulary-content front-content">
                        <div class="word-line">
                            <span class="word">${card.vocabulary.word}</span>${wordTypeInline}
                        </div>
                        ${phoneticHtml}
                        <button class="speak-btn-large" onclick="event.stopPropagation(); speak('${card.vocabulary.word}')">🔊</button>
                        <div class="card-hint-text">Click để xem nghĩa</div>
                    </div>
                </div>
                <div class="flashcard-back">
                    <div class="vocabulary-content back-content">
                        <div class="meaning-vietnamese">${card.vocabulary.meaning}</div>
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

// Render clickable synonym buttons
function renderSynonymButtons(exampleEn) {
    if (!exampleEn) return '';

    // Extract synonyms from "Synonyms: word1, word2, word3" format
    let synonymsText = exampleEn;
    if (synonymsText.startsWith('Synonyms:')) {
        synonymsText = synonymsText.replace('Synonyms:', '').trim();
    }

    const synonyms = synonymsText.split(',').map(s => s.trim()).filter(s => s.length > 0);

    if (synonyms.length === 0) return '';

    const buttons = synonyms.map(synonym =>
        `<button class="synonym-btn" onclick="event.stopPropagation(); speak('${synonym}')">
            <span class="synonym-text">${synonym}</span>
            <span class="synonym-speaker">🔊</span>
        </button>`
    ).join('');

    return `<div class="synonyms-container">
        <div class="synonyms-label">Từ đồng nghĩa:</div>
        <div class="synonyms-buttons">${buttons}</div>
    </div>`;
}

function toggleFlip(element) {
    element.classList.toggle('flipped');
}

// Mode Switching
function switchMode(mode) {
    elements.tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    elements.modeSections.forEach(section => section.classList.remove('active'));
    document.getElementById(mode + 'Mode').classList.add('active');

    if (mode === 'study') initStudyMode();
    if (mode === 'quiz') initQuizMode();
}

// Study Mode
let studyCards = []; // Cards for study session

function initStudyMode() {
    // Filter by selected category
    const filter = elements.studyCategoryFilter ? elements.studyCategoryFilter.value : 'all';
    const filteredCards = filter === 'all'
        ? [...flashcards]
        : flashcards.filter(c => c.batch === parseInt(filter));

    studyCards = filteredCards;

    if (studyCards.length === 0) {
        elements.studyWord.textContent = 'Chưa có thẻ nào';
        elements.studyWordType.textContent = '';
        elements.studyPhonetic.textContent = '';
        elements.studyMeaning.textContent = 'Vui lòng tạo thẻ hoặc chọn danh mục khác';
        return;
    }

    // Find first unlearned card
    currentStudyIndex = studyCards.findIndex(c => !c.isLearned);
    if (currentStudyIndex === -1) {
        currentStudyIndex = 0; // All learned, start from beginning
    }
    updateStudyCard();
}

function updateStudyCard() {
    if (studyCards.length === 0) return;
    const card = studyCards[currentStudyIndex];

    elements.studyWord.textContent = card.vocabulary.word;
    elements.studyWordType.textContent = card.vocabulary.wordType ? `(${card.vocabulary.wordType})` : '';
    elements.studyPhonetic.textContent = card.vocabulary.phonetic || '';
    elements.studyMeaning.textContent = card.vocabulary.meaning;

    elements.studyCard.classList.remove('flipped');

    // Count unlearned cards
    const unlearnedCount = studyCards.filter(c => !c.isLearned).length;
    const learnedCount = studyCards.length - unlearnedCount;

    elements.studyProgress.style.width = ((learnedCount / studyCards.length) * 100) + '%';
    elements.studyProgressText.textContent = `Đã học: ${learnedCount} / ${studyCards.length}`;

    elements.prevCardBtn.disabled = currentStudyIndex === 0;

    // Disable next if this is the last unlearned card
    const hasMoreUnlearned = studyCards.slice(currentStudyIndex + 1).some(c => !c.isLearned);
    elements.nextCardBtn.disabled = !hasMoreUnlearned && studyCards[currentStudyIndex].isLearned;
}

function navigateStudy(direction) {
    if (direction === 1) {
        // Going forward: mark current as learned and find next unlearned
        studyCards[currentStudyIndex].isLearned = true;

        // Update in main flashcards array
        const mainCard = flashcards.find(c => c.id === studyCards[currentStudyIndex].id);
        if (mainCard) mainCard.isLearned = true;

        saveToLocalStorage();
        updateStats();
        renderFlashcards();

        // Find next unlearned card
        const nextUnlearned = studyCards.findIndex((c, i) => i > currentStudyIndex && !c.isLearned);
        if (nextUnlearned !== -1) {
            currentStudyIndex = nextUnlearned;
        } else {
            // All done! Show completion message
            alert('🎉 Chúc mừng! Bạn đã học hết tất cả từ vựng!');
        }
    } else {
        // Going back: just go to previous card
        currentStudyIndex = Math.max(0, currentStudyIndex - 1);
    }
    updateStudyCard();
}

function rateCard(rating) {
    // Rating buttons no longer needed, but keep for compatibility
    if (studyCards.length === 0) return;
    studyCards[currentStudyIndex].isLearned = rating === 'easy';

    const mainCard = flashcards.find(c => c.id === studyCards[currentStudyIndex].id);
    if (mainCard) mainCard.isLearned = rating === 'easy';

    saveToLocalStorage();
    updateStats();
    renderFlashcards();

    if (currentStudyIndex < studyCards.length - 1) {
        navigateStudy(1);
    }
}

function speakWord() {
    if (studyCards.length === 0) return;
    speak(studyCards[currentStudyIndex].vocabulary.word);
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
}

// Quiz Mode
let quizCards = []; // Cards for quiz session
let quizCurrentIndex = 0; // Track current question index
let quizTotalQuestions = 0; // Total questions to ask

function initQuizMode() {
    // Filter by selected category
    const filter = elements.quizCategoryFilter ? elements.quizCategoryFilter.value : 'all';
    let filteredCards = filter === 'all'
        ? [...flashcards]
        : flashcards.filter(c => c.batch === parseInt(filter));

    if (filteredCards.length < 4) {
        elements.quizOptions.innerHTML = '<p style="text-align:center;color:#b2bec3;">Cần ít nhất 4 thẻ để chơi Quiz!</p>';
        document.getElementById('quizMeaning').textContent = 'Vui lòng thêm thẻ hoặc chọn danh mục khác';
        return;
    }

    // Get number of words from user input
    const wordCountInput = document.getElementById('quizWordCount');
    let maxWords = wordCountInput ? parseInt(wordCountInput.value) || 50 : 50;

    // Ensure maxWords is within valid range (need at least 4 for quiz options)
    maxWords = Math.max(4, Math.min(maxWords, filteredCards.length));

    // Update the input to reflect actual count if it's more than available
    if (wordCountInput && maxWords < parseInt(wordCountInput.value)) {
        wordCountInput.value = maxWords;
    }

    // Shuffle and pick random words based on user input
    const shuffled = filteredCards.sort(() => Math.random() - 0.5);
    quizCards = shuffled.slice(0, maxWords);
    quizCurrentIndex = 0;
    quizTotalQuestions = quizCards.length;

    console.log(`Quiz: Selected ${quizCards.length} random words from ${filteredCards.length} in category`);

    quizScore = 0;
    quizCorrectCount = 0; // Reset correct count
    quizWrongAnswers = []; // Reset wrong answers list
    quizSeconds = 0;
    elements.quizScore.textContent = '0';
    if (quizTimer) clearInterval(quizTimer);
    quizTimer = setInterval(() => {
        quizSeconds++;
        const mins = Math.floor(quizSeconds / 60).toString().padStart(2, '0');
        const secs = (quizSeconds % 60).toString().padStart(2, '0');
        elements.quizTimer.textContent = `${mins}:${secs}`;
    }, 1000);
    nextQuizQuestion();
}

// Update max word count for quiz based on selected category
function updateQuizWordCountMax() {
    const filter = elements.quizCategoryFilter ? elements.quizCategoryFilter.value : 'all';
    const filteredCards = filter === 'all'
        ? [...flashcards]
        : flashcards.filter(c => c.batch === parseInt(filter));

    const wordCountInput = document.getElementById('quizWordCount');
    if (wordCountInput) {
        wordCountInput.max = filteredCards.length;
        // If current value is higher than max available, adjust it
        if (parseInt(wordCountInput.value) > filteredCards.length) {
            wordCountInput.value = Math.max(4, filteredCards.length);
        }
    }
}

function nextQuizQuestion() {
    elements.quizResult.classList.remove('show', 'correct', 'wrong');

    // Check if quiz is completed
    if (quizCurrentIndex >= quizTotalQuestions) {
        showQuizCompletionScreen();
        return;
    }

    // Get current card and 3 random distractors
    const currentCard = quizCards[quizCurrentIndex];
    const otherCards = quizCards.filter((_, i) => i !== quizCurrentIndex);
    const shuffledOthers = otherCards.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [currentCard, ...shuffledOthers].sort(() => Math.random() - 0.5);

    // Update progress display
    const progressText = `Câu ${quizCurrentIndex + 1}/${quizTotalQuestions}`;
    document.getElementById('quizMeaning').innerHTML = `
        <div class="quiz-progress-indicator">${progressText}</div>
        <div class="quiz-meaning-text">${currentCard.vocabulary.meaning}</div>
    `;

    // Options are English words
    elements.quizOptions.innerHTML = options.map(opt => `
        <button class="quiz-option" data-correct="${opt.id === currentCard.id}" onclick="checkAnswer(this, '${currentCard.id}')">
            ${opt.vocabulary.word}${opt.vocabulary.wordType ? ' (' + opt.vocabulary.wordType + ')' : ''}
        </button>
    `).join('');
}

let quizCorrectCount = 0; // Track correct answers
let quizWrongAnswers = []; // Track wrong answers for review

function checkAnswer(btn, correctId) {
    // Get current card for speaking
    const currentCard = quizCards[quizCurrentIndex];
    const isCorrect = btn.dataset.correct === 'true';

    document.querySelectorAll('.quiz-option').forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.dataset.correct === 'true') opt.classList.add('correct');
        else if (opt === btn && !isCorrect) opt.classList.add('wrong');
    });

    elements.quizResult.className = 'quiz-result show ' + (isCorrect ? 'correct' : 'wrong');
    elements.quizResult.innerHTML = `
        <div class="result-icon">${isCorrect ? '🎉' : '😢'}</div>
        <div class="result-text">${isCorrect ? 'Chính xác!' : 'Sai rồi!'}</div>
    `;

    if (isCorrect) {
        quizScore += 10;
        quizCorrectCount++;
        elements.quizScore.textContent = quizScore;
        // Speak the correct word
        speak(currentCard.vocabulary.word);
    } else {
        // Save wrong answer for review
        quizWrongAnswers.push({
            word: currentCard.vocabulary.word,
            wordType: currentCard.vocabulary.wordType || '',
            meaning: currentCard.vocabulary.meaning,
            phonetic: currentCard.vocabulary.phonetic || ''
        });
    }

    // Move to next question
    quizCurrentIndex++;
    setTimeout(nextQuizQuestion, 1500);
}

function showQuizCompletionScreen() {
    // Stop timer
    if (quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
    }

    const wrongCount = quizTotalQuestions - quizCorrectCount;
    const accuracy = Math.round((quizCorrectCount / quizTotalQuestions) * 100);
    const mins = Math.floor(quizSeconds / 60).toString().padStart(2, '0');
    const secs = (quizSeconds % 60).toString().padStart(2, '0');

    // Determine grade emoji and message
    let gradeEmoji, gradeMessage;
    if (accuracy >= 90) {
        gradeEmoji = '🏆';
        gradeMessage = 'Xuất sắc!';
    } else if (accuracy >= 70) {
        gradeEmoji = '🎉';
        gradeMessage = 'Tốt lắm!';
    } else if (accuracy >= 50) {
        gradeEmoji = '👍';
        gradeMessage = 'Khá tốt!';
    } else {
        gradeEmoji = '💪';
        gradeMessage = 'Cố gắng thêm!';
    }

    // Display completion screen
    document.getElementById('quizMeaning').innerHTML = `
        <div class="quiz-completion">
            <div class="completion-emoji">${gradeEmoji}</div>
            <div class="completion-title">${gradeMessage}</div>
        </div>
    `;

    elements.quizOptions.innerHTML = `
        <div class="quiz-final-stats">
            <div class="final-stat-row">
                <span class="final-stat-label">✅ Đúng:</span>
                <span class="final-stat-value correct">${quizCorrectCount}</span>
            </div>
            <div class="final-stat-row">
                <span class="final-stat-label">❌ Sai:</span>
                <span class="final-stat-value wrong">${wrongCount}</span>
            </div>
            <div class="final-stat-row">
                <span class="final-stat-label">📊 Tỉ lệ:</span>
                <span class="final-stat-value">${accuracy}%</span>
            </div>
            <div class="final-stat-row">
                <span class="final-stat-label">⏱️ Thời gian:</span>
                <span class="final-stat-value">${mins}:${secs}</span>
            </div>
            <div class="final-stat-row">
                <span class="final-stat-label">🎯 Điểm:</span>
                <span class="final-stat-value highlight">${quizScore}</span>
            </div>
        </div>
        <div class="quiz-completion-buttons">
            <button class="btn btn-primary quiz-restart-btn" onclick="initQuizMode()">
                🔄 Làm lại
            </button>
            ${wrongCount > 0 ? `<button class="btn btn-secondary quiz-review-btn" onclick="showWrongAnswers()">
                📝 Xem từ sai (${wrongCount})
            </button>` : ''}
        </div>
        <div id="wrongAnswersList" class="wrong-answers-list" style="display: none;"></div>
    `;

    elements.quizResult.classList.remove('show');
}

// Show wrong answers for review
function showWrongAnswers() {
    const listContainer = document.getElementById('wrongAnswersList');
    if (!listContainer) return;

    // Toggle visibility
    if (listContainer.style.display === 'none') {
        listContainer.style.display = 'block';
        listContainer.innerHTML = `
            <div class="wrong-answers-header">
                <h4>📝 Các từ cần ôn lại:</h4>
            </div>
            <div class="wrong-answers-cards">
                ${quizWrongAnswers.map(item => `
                    <div class="wrong-answer-card">
                        <div class="wrong-word-line">
                            <span class="wrong-word">${item.word}</span>
                            ${item.wordType ? `<span class="wrong-word-type">(${item.wordType})</span>` : ''}
                        </div>
                        ${item.phonetic ? `<div class="wrong-phonetic">${item.phonetic}</div>` : ''}
                        <button class="speak-btn-small" onclick="speak('${item.word.replace(/'/g, "\\'")}')">🔊</button>
                        <div class="wrong-meaning">${item.meaning}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        listContainer.style.display = 'none';
    }
}

// Card Management
function shuffleCards() {
    flashcards = flashcards.sort(() => Math.random() - 0.5);
    renderFlashcards();
}

function deleteCard(id) {
    if (confirm('Bạn có chắc muốn xóa thẻ này?')) {
        flashcards = flashcards.filter(c => c.id !== id);
        saveToLocalStorage();
        renderFlashcards();
        updateStats();
    }
}

function deleteAllCards() {
    if (flashcards.length === 0) {
        alert('Không có thẻ nào để xóa!');
        return;
    }
    if (confirm(`Bạn có chắc muốn xóa TẤT CẢ ${flashcards.length} thẻ? Hành động này không thể hoàn tác!`)) {
        flashcards = [];
        saveToLocalStorage();
        renderFlashcards();
        updateStats();
        alert('Đã xóa tất cả thẻ!');
    }
}

function openEditModal(id) {
    currentEditId = id;
    const card = flashcards.find(c => c.id === id);
    if (!card) return;

    elements.modalPreviewImage.innerHTML = `<img src="${card.imageUrl}" alt="Preview">`;
    elements.inputWord.value = card.vocabulary.word;
    elements.inputPhonetic.value = card.vocabulary.phonetic;
    elements.inputMeaning.value = card.vocabulary.meaning;
    elements.inputExampleEn.value = card.vocabulary.exampleEn;
    elements.inputExampleVi.value = card.vocabulary.exampleVi;
    elements.inputCategory.value = card.category;

    elements.modal.classList.add('show');
}

function closeModal() {
    elements.modal.classList.remove('show');
    currentEditId = null;
}

function saveCardFromModal() {
    if (!currentEditId) return;
    const card = flashcards.find(c => c.id === currentEditId);
    if (!card) return;

    card.vocabulary.word = elements.inputWord.value || 'Word';
    card.vocabulary.phonetic = elements.inputPhonetic.value || '/phonetic/';
    card.vocabulary.meaning = elements.inputMeaning.value || 'Nghĩa';
    card.vocabulary.exampleEn = elements.inputExampleEn.value || 'Example';
    card.vocabulary.exampleVi = elements.inputExampleVi.value || 'Ví dụ';
    card.category = elements.inputCategory.value;

    saveToLocalStorage();
    renderFlashcards();
    closeModal();
}

// Stats
function updateStats() {
    elements.totalCards.textContent = flashcards.length;
    elements.learnedCards.textContent = flashcards.filter(c => c.isLearned).length;
}

// Local Storage
function saveToLocalStorage() {
    localStorage.setItem('flashcards', JSON.stringify(flashcards));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('flashcards');
    if (saved) flashcards = JSON.parse(saved);
}

// ==========================================
// SPELLING MODE (Fill-in-the-blank)
// ==========================================

let spellingCards = [];
let currentSpellingCard = null;
let spellingScore = 0;
let spellingStreak = 0;
let spellingCorrectCount = 0;
let spellingWrongCount = 0;
let spellingWrongAnswers = []; // Track wrong answers for review
let currentHintLevel = 0;
let hasAnswered = false;
let currentAttempts = 0;
const MAX_ATTEMPTS = 3;

// DOM Elements for Spelling Mode
const spellingElements = {
    categoryFilter: null,
    score: null,
    streak: null,
    meaning: null,
    hint: null,
    showHintBtn: null,
    input: null,
    submitBtn: null,
    result: null,
    correctAnswer: null,
    nextBtn: null,
    speakBtn: null,
    correctCount: null,
    wrongCount: null,
    accuracy: null,
};

function initSpellingElements() {
    spellingElements.categoryFilter = document.getElementById('spellingCategoryFilter');
    spellingElements.score = document.getElementById('spellingScore');
    spellingElements.streak = document.getElementById('spellingStreak');
    spellingElements.meaning = document.getElementById('spellingMeaning');
    spellingElements.hint = document.getElementById('spellingHint');
    spellingElements.showHintBtn = document.getElementById('showHintBtn');
    spellingElements.input = document.getElementById('spellingInput');
    spellingElements.submitBtn = document.getElementById('spellingSubmitBtn');
    spellingElements.result = document.getElementById('spellingResult');
    spellingElements.correctAnswer = document.getElementById('spellingCorrectAnswer');
    spellingElements.nextBtn = document.getElementById('spellingNextBtn');
    spellingElements.speakBtn = document.getElementById('spellingSpeakBtn');
    spellingElements.correctCount = document.getElementById('spellingCorrectCount');
    spellingElements.wrongCount = document.getElementById('spellingWrongCount');
    spellingElements.accuracy = document.getElementById('spellingAccuracy');
}

function setupSpellingEventListeners() {
    if (spellingElements.categoryFilter) {
        // Only update word count max when category changes, don't auto-start quiz
        spellingElements.categoryFilter.addEventListener('change', updateSpellingWordCountMax);
    }
    // Start button triggers the quiz
    const startBtn = document.getElementById('spellingStartBtn');
    if (startBtn) {
        startBtn.addEventListener('click', initSpellingMode);
    }
    if (spellingElements.submitBtn) {
        spellingElements.submitBtn.addEventListener('click', checkSpellingAnswer);
    }
    if (spellingElements.input) {
        spellingElements.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (hasAnswered) {
                    nextSpellingQuestion();
                } else {
                    checkSpellingAnswer();
                }
            }
        });
    }
    if (spellingElements.nextBtn) {
        spellingElements.nextBtn.addEventListener('click', nextSpellingQuestion);
    }
    if (spellingElements.showHintBtn) {
        spellingElements.showHintBtn.addEventListener('click', showMoreHint);
    }
    if (spellingElements.speakBtn) {
        spellingElements.speakBtn.addEventListener('click', speakCurrentSpellingWord);
    }
}

// Update max word count based on selected category
function updateSpellingWordCountMax() {
    const filter = spellingElements.categoryFilter ? spellingElements.categoryFilter.value : 'all';
    const filteredCards = filter === 'all'
        ? [...flashcards]
        : flashcards.filter(c => c.batch === parseInt(filter));

    const wordCountInput = document.getElementById('spellingWordCount');
    if (wordCountInput) {
        wordCountInput.max = filteredCards.length;
        // If current value is higher than max available, adjust it
        if (parseInt(wordCountInput.value) > filteredCards.length) {
            wordCountInput.value = filteredCards.length;
        }
    }
}

function initSpellingMode() {
    // Initialize elements if not done
    if (!spellingElements.categoryFilter) {
        initSpellingElements();
        setupSpellingEventListeners();
    }

    // Filter by selected category
    const filter = spellingElements.categoryFilter ? spellingElements.categoryFilter.value : 'all';
    let filteredCards = filter === 'all'
        ? [...flashcards]
        : flashcards.filter(c => c.batch === parseInt(filter));

    if (filteredCards.length < 1) {
        spellingElements.meaning.textContent = 'Vui lòng thêm thẻ hoặc chọn danh mục khác';
        spellingElements.hint.textContent = '---';
        spellingElements.input.disabled = true;
        spellingElements.submitBtn.disabled = true;
        return;
    }

    // Get number of words from user input
    const wordCountInput = document.getElementById('spellingWordCount');
    let maxWords = wordCountInput ? parseInt(wordCountInput.value) || 50 : 50;

    // Ensure maxWords is within valid range
    maxWords = Math.max(1, Math.min(maxWords, filteredCards.length));

    // Update the input to reflect actual count if it's more than available
    if (wordCountInput && maxWords < parseInt(wordCountInput.value)) {
        wordCountInput.value = maxWords;
    }

    // Shuffle and pick random words based on user input
    const shuffled = filteredCards.sort(() => Math.random() - 0.5);
    spellingCards = shuffled.slice(0, maxWords);
    spellingCurrentIndex = 0; // Reset question index
    spellingTotalQuestions = spellingCards.length; // Set total questions

    // Reset stats
    spellingScore = 0;
    spellingStreak = 0;
    spellingCorrectCount = 0;
    spellingWrongCount = 0;
    spellingWrongAnswers = []; // Reset wrong answers list
    updateSpellingStats();

    // Show total words info
    const totalInCategory = filteredCards.length;
    const selectedCount = spellingCards.length;
    console.log(`Spelling Quiz: Selected ${selectedCount} random words from ${totalInCategory} in category`);

    // Enable input
    spellingElements.input.disabled = false;
    spellingElements.submitBtn.disabled = false;

    nextSpellingQuestion();
}

let spellingCurrentIndex = 0; // Track current question index
let spellingTotalQuestions = 0; // Total questions to ask

function nextSpellingQuestion() {
    // Check if spelling quiz is completed
    if (spellingCurrentIndex >= spellingTotalQuestions) {
        showSpellingCompletionScreen();
        return;
    }

    // Reset state
    hasAnswered = false;
    currentHintLevel = 0;
    currentAttempts = 0; // Reset attempts for new question
    spellingElements.result.classList.remove('show', 'correct', 'wrong');
    spellingElements.input.value = '';
    spellingElements.input.classList.remove('correct', 'wrong');
    spellingElements.input.disabled = false;
    spellingElements.submitBtn.disabled = false;
    spellingElements.showHintBtn.disabled = false;
    spellingElements.input.focus();

    // Get current card
    currentSpellingCard = spellingCards[spellingCurrentIndex];

    // Display progress and question with meaning
    const progressText = `Câu ${spellingCurrentIndex + 1}/${spellingTotalQuestions}`;
    spellingElements.meaning.innerHTML = `
        <div class="spelling-progress-indicator">${progressText}</div>
        <div class="spelling-meaning-text">${currentSpellingCard.vocabulary.meaning}</div>
    `;

    // Generate hint pattern (show consonants, hide vowels)
    const pattern = generateSpellingPattern(currentSpellingCard.vocabulary.word, currentHintLevel);

    // Show word type if available
    const wordType = currentSpellingCard.vocabulary.wordType;
    if (wordType) {
        spellingElements.hint.innerHTML = `${pattern} <span class="spelling-word-type">(${wordType})</span>`;
    } else {
        spellingElements.hint.textContent = pattern;
    }
}

function showSpellingCompletionScreen() {
    const accuracy = spellingCorrectCount + spellingWrongCount > 0
        ? Math.round((spellingCorrectCount / (spellingCorrectCount + spellingWrongCount)) * 100)
        : 0;

    // Determine grade emoji and message
    let gradeEmoji, gradeMessage;
    if (accuracy >= 90) {
        gradeEmoji = '🏆';
        gradeMessage = 'Xuất sắc!';
    } else if (accuracy >= 70) {
        gradeEmoji = '🎉';
        gradeMessage = 'Tốt lắm!';
    } else if (accuracy >= 50) {
        gradeEmoji = '👍';
        gradeMessage = 'Khá tốt!';
    } else {
        gradeEmoji = '💪';
        gradeMessage = 'Cố gắng thêm!';
    }

    // Display completion screen
    spellingElements.meaning.innerHTML = `
        <div class="quiz-completion">
            <div class="completion-emoji">${gradeEmoji}</div>
            <div class="completion-title">${gradeMessage}</div>
        </div>
    `;

    spellingElements.hint.innerHTML = '';
    spellingElements.input.style.display = 'none';
    spellingElements.submitBtn.style.display = 'none';
    spellingElements.showHintBtn.style.display = 'none';
    spellingElements.nextBtn.style.display = 'none';
    spellingElements.speakBtn.style.display = 'none';

    spellingElements.result.className = 'spelling-result show';
    spellingElements.result.innerHTML = `
        <div class="quiz-final-stats">
            <div class="final-stat-row">
                <span class="final-stat-label">✅ Đúng:</span>
                <span class="final-stat-value correct">${spellingCorrectCount}</span>
            </div>
            <div class="final-stat-row">
                <span class="final-stat-label">❌ Sai:</span>
                <span class="final-stat-value wrong">${spellingWrongCount}</span>
            </div>
            <div class="final-stat-row">
                <span class="final-stat-label">📊 Tỉ lệ:</span>
                <span class="final-stat-value">${accuracy}%</span>
            </div>
            <div class="final-stat-row">
                <span class="final-stat-label">🔥 Streak cao nhất:</span>
                <span class="final-stat-value">${spellingStreak}</span>
            </div>
            <div class="final-stat-row">
                <span class="final-stat-label">🎯 Điểm:</span>
                <span class="final-stat-value highlight">${spellingScore}</span>
            </div>
        </div>
        <div class="quiz-completion-buttons">
            <button class="btn btn-primary quiz-restart-btn" onclick="restartSpellingMode()">
                🔄 Làm lại
            </button>
            ${spellingWrongCount > 0 ? `<button class="btn btn-secondary quiz-review-btn" onclick="showSpellingWrongAnswers()">
                📝 Xem từ sai (${spellingWrongCount})
            </button>` : ''}
        </div>
        <div id="spellingWrongAnswersList" class="wrong-answers-list" style="display: none;"></div>
    `;
}

function restartSpellingMode() {
    // Reset UI elements visibility
    spellingElements.input.style.display = '';
    spellingElements.submitBtn.style.display = '';
    spellingElements.showHintBtn.style.display = '';
    spellingElements.nextBtn.style.display = '';
    spellingElements.speakBtn.style.display = '';

    initSpellingMode();
}

// Show spelling wrong answers for review
function showSpellingWrongAnswers() {
    const listContainer = document.getElementById('spellingWrongAnswersList');
    if (!listContainer) return;

    // Toggle visibility
    if (listContainer.style.display === 'none') {
        listContainer.style.display = 'block';
        listContainer.innerHTML = `
            <div class="wrong-answers-header">
                <h4>📝 Các từ cần ôn lại:</h4>
            </div>
            <div class="wrong-answers-cards">
                ${spellingWrongAnswers.map(item => `
                    <div class="wrong-answer-card">
                        <div class="wrong-word-line">
                            <span class="wrong-word">${item.word}</span>
                            ${item.wordType ? `<span class="wrong-word-type">(${item.wordType})</span>` : ''}
                        </div>
                        ${item.phonetic ? `<div class="wrong-phonetic">${item.phonetic}</div>` : ''}
                        <button class="speak-btn-small" onclick="speak('${item.word.replace(/'/g, "\\'")}')">🔊</button>
                        <div class="wrong-meaning">${item.meaning}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        listContainer.style.display = 'none';
    }
}

/**
 * Generate spelling pattern based on hint level
 * Level 0: Show first letter and consonants, hide vowels (r_m_v_)
 * Level 1: Show more letters
 * Level 2: Show most letters
 */
function generateSpellingPattern(word, level) {
    const vowels = 'aeiouAEIOU';
    const wordLower = word.toLowerCase();
    let pattern = '';

    for (let i = 0; i < word.length; i++) {
        const char = word[i];

        // Always show spaces and special characters
        if (char === ' ' || char === '-' || char === '\'') {
            pattern += char;
            continue;
        }

        // Always show first letter
        if (i === 0) {
            pattern += char;
            continue;
        }

        // Determine what to show based on hint level
        if (level === 0) {
            // Level 0: Show consonants only (hide vowels)
            if (vowels.includes(char)) {
                pattern += '_';
            } else {
                pattern += char;
            }
        } else if (level === 1) {
            // Level 1: Show every other hidden letter
            if (vowels.includes(char)) {
                // Show half the vowels
                if (i % 2 === 0) {
                    pattern += char;
                } else {
                    pattern += '_';
                }
            } else {
                pattern += char;
            }
        } else {
            // Level 2: Show almost everything, just hide 1-2 letters
            const hiddenCount = pattern.split('_').length - 1;
            if (hiddenCount < 2 && vowels.includes(char) && i !== word.length - 1) {
                pattern += '_';
            } else {
                pattern += char;
            }
        }
    }

    return pattern;
}

function showMoreHint() {
    if (currentHintLevel < 2 && currentSpellingCard) {
        currentHintLevel++;
        const pattern = generateSpellingPattern(currentSpellingCard.vocabulary.word, currentHintLevel);
        spellingElements.hint.textContent = pattern;

        // Disable hint button at max level
        if (currentHintLevel >= 2) {
            spellingElements.showHintBtn.disabled = true;
        }

        // Reduce potential score for using hint
        spellingScore = Math.max(0, spellingScore - 2);
        updateSpellingStats();
    }
}

function checkSpellingAnswer() {
    if (!currentSpellingCard || hasAnswered) return;

    const userAnswer = spellingElements.input.value.trim().toLowerCase();
    const correctAnswer = currentSpellingCard.vocabulary.word.toLowerCase();

    if (userAnswer === correctAnswer) {
        // Correct answer
        hasAnswered = true;
        spellingElements.input.disabled = true;
        spellingElements.submitBtn.disabled = true;
        spellingElements.showHintBtn.disabled = true;

        spellingElements.input.classList.add('correct');
        spellingElements.result.className = 'spelling-result show correct';
        spellingElements.result.innerHTML = `
            <div class="result-icon">🎉</div>
            <div class="result-text">Chính xác!</div>
        `;

        // Update score and streak
        spellingStreak++;
        spellingCorrectCount++;
        spellingCurrentIndex++; // Move to next question

        // Bonus points for streak (reduced if needed retries)
        const baseScore = Math.max(10 - (currentAttempts * 3), 2); // Reduce score for each retry
        const streakBonus = Math.min(spellingStreak - 1, 5) * 2;
        spellingScore += baseScore + streakBonus;

        // Speak the word
        speak(currentSpellingCard.vocabulary.word);

        updateSpellingStats();
        spellingElements.nextBtn.focus();
    } else {
        // Wrong answer
        currentAttempts++;

        spellingElements.input.classList.add('wrong');

        if (currentAttempts >= MAX_ATTEMPTS) {
            // Max attempts reached - show correct answer
            hasAnswered = true;
            spellingElements.input.disabled = true;
            spellingElements.submitBtn.disabled = true;
            spellingElements.showHintBtn.disabled = true;

            spellingElements.result.className = 'spelling-result show wrong';
            spellingElements.result.innerHTML = `
                <div class="result-icon">😢</div>
                <div class="result-text">Hết lượt thử!</div>
                <div class="result-answer">Đáp án: <strong>${currentSpellingCard.vocabulary.word}</strong></div>
            `;

            // Reset streak and count as wrong
            spellingStreak = 0;
            spellingWrongCount++;
            spellingCurrentIndex++; // Move to next question

            // Save wrong answer for review
            spellingWrongAnswers.push({
                word: currentSpellingCard.vocabulary.word,
                wordType: currentSpellingCard.vocabulary.wordType || '',
                meaning: currentSpellingCard.vocabulary.meaning,
                phonetic: currentSpellingCard.vocabulary.phonetic || ''
            });

            updateSpellingStats();
            spellingElements.nextBtn.focus();
        } else {
            // Allow retry
            const remainingAttempts = MAX_ATTEMPTS - currentAttempts;
            spellingElements.result.className = 'spelling-result show wrong';
            spellingElements.result.innerHTML = `
                <div class="result-icon">❌</div>
                <div class="result-text">Sai rồi! Thử lại</div>
                <div class="result-answer">Còn ${remainingAttempts} lần thử</div>
            `;

            // Clear input and allow retry after a short delay
            setTimeout(() => {
                spellingElements.input.value = '';
                spellingElements.input.classList.remove('wrong');
                spellingElements.input.focus();
                // Auto-hide the result after a moment
                setTimeout(() => {
                    if (!hasAnswered) {
                        spellingElements.result.classList.remove('show');
                    }
                }, 1500);
            }, 800);
        }
    }
}

function speakCurrentSpellingWord() {
    if (currentSpellingCard) {
        speak(currentSpellingCard.vocabulary.word);
    }
}

function updateSpellingStats() {
    if (spellingElements.score) {
        spellingElements.score.textContent = spellingScore;
    }
    if (spellingElements.streak) {
        spellingElements.streak.textContent = spellingStreak;
    }
    if (spellingElements.correctCount) {
        spellingElements.correctCount.textContent = spellingCorrectCount;
    }
    if (spellingElements.wrongCount) {
        spellingElements.wrongCount.textContent = spellingWrongCount;
    }
    if (spellingElements.accuracy) {
        const total = spellingCorrectCount + spellingWrongCount;
        const accuracy = total > 0 ? Math.round((spellingCorrectCount / total) * 100) : 0;
        spellingElements.accuracy.textContent = accuracy + '%';
    }
}

// Update switchMode to include spelling
const originalSwitchMode = switchMode;
switchMode = function (mode) {
    elements.tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
    elements.modeSections.forEach(section => section.classList.remove('active'));
    document.getElementById(mode + 'Mode').classList.add('active');

    if (mode === 'study') initStudyMode();
    if (mode === 'quiz') initQuizMode();
    if (mode === 'spelling') initSpellingMode();
};

// Update updateCategoryFilter to include spelling filter
const originalUpdateCategoryFilter = updateCategoryFilter;
updateCategoryFilter = function () {
    const batches = [...new Set(flashcards.map(c => c.batch).filter(b => b))].sort((a, b) => a - b);
    let options = '<option value="all">Tất cả danh mục</option>';
    batches.forEach(batch => {
        const count = flashcards.filter(c => c.batch === batch).length;
        options += `<option value="${batch}">📁 Danh mục ${batch} (${count} từ)</option>`;
    });

    // Update all category filters including spelling
    if (elements.categoryFilter) elements.categoryFilter.innerHTML = options;
    if (elements.studyCategoryFilter) elements.studyCategoryFilter.innerHTML = options;
    if (elements.quizCategoryFilter) elements.quizCategoryFilter.innerHTML = options;

    const spellingCategoryFilter = document.getElementById('spellingCategoryFilter');
    if (spellingCategoryFilter) spellingCategoryFilter.innerHTML = options;
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

// Expose functions to global scope for inline HTML onclick handlers
window.toggleFlip = toggleFlip;
window.deleteCard = deleteCard;
window.openEditModal = openEditModal;
window.speak = speak;
window.checkAnswer = checkAnswer;
window.checkSpellingAnswer = checkSpellingAnswer;
window.nextSpellingQuestion = nextSpellingQuestion;
window.restartSpellingMode = restartSpellingMode;
window.initQuizMode = initQuizMode;

