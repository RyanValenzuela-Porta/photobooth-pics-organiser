// Face Sorter - Main Application Script

// State
let filteredPeople = [...peopleData];
const peopleList = document.getElementById('peopleList');
const searchInput = document.getElementById('searchInput');
const resultCount = document.getElementById('resultCount');
const totalPeopleEl = document.getElementById('totalPeople');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderPeopleList();
    updateCounts();
    setupSearch();
});

// Render the people list
function renderPeopleList() {
    peopleList.innerHTML = '';
    
    if (filteredPeople.length === 0) {
        peopleList.innerHTML = '<div class="loading">No matching people found</div>';
        return;
    }
    
    filteredPeople.forEach((person, index) => {
        const row = createPersonRow(person, index);
        peopleList.appendChild(row);
    });
}

// Create a person row element
function createPersonRow(person, index) {
    const row = document.createElement('div');
    row.className = 'person-row';
    row.dataset.index = index;
    row.dataset.name = person.name.toLowerCase();
    
    // Person header (always visible)
    const header = document.createElement('div');
    header.className = 'person-header';
    
    // Profile image and name
    const infoDiv = document.createElement('div');
    infoDiv.className = 'person-info';
    
    const profileImg = document.createElement('img');
    profileImg.className = 'profile-img';
    // Profile pics are in unique_faces_md folder
    profileImg.src = `unique_faces_md/${person.profile_pic}`;
    profileImg.alt = `${person.name} profile`;
    profileImg.loading = 'lazy';
    profileImg.onerror = () => {
        profileImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiIGZpbGw9IiNlZWUiLz4KPHRleHQgeD0iMzAiIHk9IjM1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iYXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiPlBob3RvPC90ZXh0Pgo8L3N2Zz4=';
    };
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'person-name';
    nameSpan.textContent = person.name;
    
    infoDiv.appendChild(profileImg);
    infoDiv.appendChild(nameSpan);
    
    // Actions (arrow button and download all)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'person-actions';
    
    // Arrow button
    const arrowBtn = document.createElement('button');
    arrowBtn.className = 'btn btn-secondary btn-icon arrow-btn';
    arrowBtn.setAttribute('aria-label', 'Expand to view photos');
    arrowBtn.setAttribute('aria-expanded', 'false');
    arrowBtn.innerHTML = `
        <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    `;
    arrowBtn.addEventListener('click', () => toggleCard(row, person, arrowBtn));
    
    // Download all button
    const downloadAllBtn = document.createElement('button');
    downloadAllBtn.className = 'btn btn-primary';
    downloadAllBtn.innerHTML = `
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        Download All
    `;
    downloadAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadAllImages(person, downloadAllBtn);
    });
    
    if (person.images.length === 0) {
        downloadAllBtn.disabled = true;
        downloadAllBtn.title = 'No images available';
    }
    
    actionsDiv.appendChild(arrowBtn);
    actionsDiv.appendChild(downloadAllBtn);
    
    header.appendChild(infoDiv);
    header.appendChild(actionsDiv);
    
    // Person card (expandable content)
    const card = document.createElement('div');
    card.className = 'person-card';
    card.id = `card-${index}`;
    
    row.appendChild(header);
    row.appendChild(card);
    
    return row;
}

// Toggle card expansion
function toggleCard(row, person, arrowBtn) {
    const card = row.querySelector('.person-card');
    const isExpanded = card.classList.toggle('expanded');
    arrowBtn.classList.toggle('expanded', isExpanded);
    arrowBtn.setAttribute('aria-expanded', isExpanded);
    arrowBtn.setAttribute('aria-label', isExpanded ? 'Collapse photos' : 'Expand to view photos');
    
    if (isExpanded && card.children.length === 0) {
        // First time expanding - populate the card
        populateCard(card, person);
    }
}

// Populate card with images
function populateCard(card, person) {
    if (person.images.length === 0) {
        card.innerHTML = '<div class="no-images">No photos available for this person</div>';
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'images-grid';
    
    person.images.forEach(imageName => {
        const item = document.createElement('div');
        item.className = 'image-item';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';
        
        const img = document.createElement('img');
        img.src = `photobooth_customs/${imageName}`;
        img.alt = `${person.name} - ${imageName}`;
        img.loading = 'lazy';
        
        wrapper.appendChild(img);
        
        const filenameDiv = document.createElement('div');
        filenameDiv.className = 'image-filename';
        filenameDiv.textContent = imageName;
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = `
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Download
        `;
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadSingleImage(imageName, downloadBtn);
        });
        
        item.appendChild(wrapper);
        item.appendChild(filenameDiv);
        item.appendChild(downloadBtn);
        
        grid.appendChild(item);
    });
    
    card.appendChild(grid);
}

// Download all images for a person as a ZIP file (single download dialog)
async function downloadAllImages(person, btn) {
    if (person.images.length === 0) return;
    
    const originalHTML = btn.innerHTML;
    
    // Check if JSZip is available
    if (typeof JSZip === 'undefined') {
        console.warn('JSZip not loaded, falling back to sequential downloads');
        await downloadAllSequential(person, btn, originalHTML);
        return;
    }
    
    btn.innerHTML = `
        <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/>
            <path stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10">
                <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/>
            </path>
        </svg>
        Preparing ZIP...
    `;
    btn.disabled = true;
    
    try {
        const zip = new JSZip();
        let successCount = 0;
        
        // Fetch all images and add to ZIP
        for (let i = 0; i < person.images.length; i++) {
            const imageName = person.images[i];
            
            btn.innerHTML = `
                <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/>
                    <path stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10">
                        <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/>
                    </path>
                </svg>
                Adding ${i + 1}/${person.images.length}...
            `;
            
            try {
                const response = await fetch(`photobooth_customs/${imageName}`);
                if (response.ok) {
                    const blob = await response.blob();
                    zip.file(imageName, blob);
                    successCount++;
                }
            } catch (e) {
                console.error(`Failed to add ${imageName} to ZIP:`, e);
            }
        }
        
        if (successCount === 0) {
            throw new Error('No images could be fetched');
        }
        
        btn.innerHTML = `
            <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/>
                <path stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10">
                    <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/>
                </path>
            </svg>
            Creating ZIP...
        `;
        
        // Generate ZIP blob
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        
        // Trigger download
        const zipName = `${person.name.replace(/[^a-z0-9]/gi, '_')}_photos.zip`;
        const blobUrl = URL.createObjectURL(zipBlob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = zipName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        
        btn.innerHTML = `
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Downloaded ${successCount} photos
        `;
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('ZIP download failed:', error);
        // Fall back to sequential downloads
        await downloadAllSequential(person, btn, originalHTML);
    }
}

// Download all images sequentially (fallback method)
async function downloadAllSequential(person, btn, originalHTML) {
    btn.innerHTML = `
        <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/>
            <path stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10">
                <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/>
            </path>
        </svg>
        Downloading...
    `;
    btn.disabled = true;
    
    try {
        for (let i = 0; i < person.images.length; i++) {
            const imageName = person.images[i];
            await downloadSingleImage(imageName);
            if (i < person.images.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

// Download a single image by fetching as blob and triggering download
async function downloadSingleImage(imageName, btn = null) {
    const url = `photobooth_customs/${imageName}`;
    
    if (btn) {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `
            <svg class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/>
                <path stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10">
                    <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/>
                </path>
            </svg>
        `;
        btn.disabled = true;
        
        try {
            await fetchAndDownload(url, imageName);
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    } else {
        await fetchAndDownload(url, imageName);
    }
}

async function fetchAndDownload(url, filename) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up object URL after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
        console.error('Download failed:', error);
    }
}

// Search functionality
function setupSearch() {
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.toLowerCase().trim();
            filterPeople(query);
        }, 150);
    });
    
    // Clear search on Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            filterPeople('');
            searchInput.blur();
        }
    });
}

function filterPeople(query) {
    if (!query) {
        filteredPeople = [...peopleData];
    } else {
        filteredPeople = peopleData.filter(person => 
            person.name.toLowerCase().includes(query)
        );
    }
    renderPeopleList();
    updateCounts();
}

function updateCounts() {
    const total = peopleData.length;
    const showing = filteredPeople.length;
    
    totalPeopleEl.textContent = total;
    
    if (searchInput.value.trim()) {
        resultCount.textContent = `${showing} of ${total} results`;
    } else {
        resultCount.textContent = '';
    }
}

// Keyboard navigation for accessibility
document.addEventListener('keydown', (e) => {
    // Enter/Space on arrow button toggles card
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.arrow-btn')) {
        e.preventDefault();
        e.target.closest('.arrow-btn').click();
    }
});