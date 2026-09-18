// Gallery Page - Main Application Script

// State
let allImages = []; // { filename, people: [{name, profilePic}] }
let filteredImages = [];
const galleryGrid = document.getElementById('galleryGrid');
const searchInput = document.getElementById('searchInput');
const resultCount = document.getElementById('resultCount');
const totalImagesEl = document.getElementById('totalImages');
const totalImagesFooter = document.getElementById('totalImagesFooter');
const downloadAllBtn = document.getElementById('downloadAllBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    buildImageList();
    renderGallery();
    updateCounts();
    setupSearch();
    setupDownloadAll();
    setupModal();
});

// Build flat list of all images with ALL people in each photo
function buildImageList() {
    // Map filename -> { filename, people: [] }
    const imageMap = new Map();
    
    peopleData.forEach(person => {
        person.images.forEach(imageName => {
            if (!imageMap.has(imageName)) {
                imageMap.set(imageName, {
                    filename: imageName,
                    people: []
                });
            }
            imageMap.get(imageName).people.push({
                name: person.name,
                profilePic: person.profile_pic
            });
        });
    });
    
    // Convert to array, sort by filename (newest first based on date in filename)
    allImages = Array.from(imageMap.values()).sort((a, b) => 
        b.filename.localeCompare(a.filename)
    );
    
    filteredImages = [...allImages];
}

// Render the gallery grid
function renderGallery() {
    galleryGrid.innerHTML = '';
    
    if (filteredImages.length === 0) {
        galleryGrid.innerHTML = '<div class="loading">No matching images found</div>';
        return;
    }
    
    filteredImages.forEach((image, index) => {
        const item = createGalleryItem(image, index);
        galleryGrid.appendChild(item);
    });
}

// Create a gallery item element
function createGalleryItem(image, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    // Store searchable data
    item.dataset.people = image.people.map(p => p.name.toLowerCase()).join(' ');
    
    const wrapper = document.createElement('div');
    wrapper.className = 'gallery-image-wrapper';
    
    const img = document.createElement('img');
    img.src = `photobooth_customs/${image.filename}`;
    img.alt = `${image.filename} - ${image.people.map(p => p.name).join(', ')}`;
    img.loading = 'lazy';
    img.onerror = () => {
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZWVlIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iYXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPC9zdmc+';
    };
    
    wrapper.appendChild(img);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'gallery-image-info';
    
    // Filename (small, for reference)
    const filenameDiv = document.createElement('div');
    filenameDiv.className = 'gallery-filename';
    filenameDiv.textContent = image.filename;
    
    // People in this photo
    const peopleDiv = document.createElement('div');
    peopleDiv.className = 'gallery-people';
    peopleDiv.innerHTML = image.people.map(person => `
        <span class="gallery-person-tag" title="${escapeHtml(person.name)}">
            <img src="unique_faces_md/${person.profilePic}" alt="" class="gallery-person-avatar" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiNlZWUiLz4KPC9zdmc+'">
            ${escapeHtml(person.name)}
        </span>
    `).join('');
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-btn gallery-download-btn';
    downloadBtn.innerHTML = `
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
    `;
    downloadBtn.title = `Download ${image.filename}`;
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadSingleImage(image.filename, downloadBtn);
    });
    
    infoDiv.appendChild(filenameDiv);
    infoDiv.appendChild(peopleDiv);
    infoDiv.appendChild(downloadBtn);
    
    item.appendChild(wrapper);
    item.appendChild(infoDiv);
    
    return item;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Search functionality - filters by person names in the photo
function setupSearch() {
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.toLowerCase().trim();
            filterImages(query);
        }, 150);
    });
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            filterImages('');
            searchInput.blur();
        }
    });
}

function filterImages(query) {
    if (!query) {
        filteredImages = [...allImages];
    } else {
        filteredImages = allImages.filter(img => 
            img.people.some(person => person.name.toLowerCase().includes(query))
        );
    }
    renderGallery();
    updateCounts();
}

function updateCounts() {
    const total = allImages.length;
    const showing = filteredImages.length;
    
    totalImagesEl.textContent = total;
    totalImagesFooter.textContent = total;
    
    if (searchInput.value.trim()) {
        resultCount.textContent = `${showing} of ${total} photos`;
    } else {
        resultCount.textContent = '';
    }
}

// Modal state
let downloadResolve = null;

// Download all as ZIP
function setupDownloadAll() {
    const modal = document.getElementById('confirmModal');
    const modalMessage = document.getElementById('confirmMessage');
    const modalOk = document.getElementById('confirmOk');
    const modalCancel = document.getElementById('confirmCancel');
    const modalOverlay = modal.querySelector('.modal-overlay');
    
    downloadAllBtn.addEventListener('click', async () => {
        if (filteredImages.length === 0) return;
        
        const count = filteredImages.length;
        const searchValue = searchInput.value.trim();
        const desc = searchValue ? `pictures of "${searchValue}"` : 'all pictures';
        
        // Show custom modal
        modalMessage.textContent = `Are you sure you want to download ${count} ${desc}?`;
        modal.classList.remove('hidden');
        
        // Wait for user response
        const confirmed = await new Promise(resolve => {
            downloadResolve = resolve;
        });
        
        if (!confirmed) return;
        
        const originalHTML = downloadAllBtn.innerHTML;
        
        if (typeof JSZip === 'undefined') {
            alert('JSZip not loaded. Please refresh the page.');
            return;
        }
        
        downloadAllBtn.innerHTML = `
            <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/>
                <path stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10">
                    <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/>
                </path>
            </svg>
            Preparing ZIP...
        `;
        downloadAllBtn.disabled = true;
        
        try {
            const zip = new JSZip();
            let successCount = 0;
            
            for (let i = 0; i < filteredImages.length; i++) {
                const image = filteredImages[i];
                
                downloadAllBtn.innerHTML = `
                    <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/>
                        <path stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10">
                            <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/>
                        </path>
                    </svg>
                    Adding ${i + 1}/${filteredImages.length}...
                `;
                
                try {
                    const response = await fetch(`photobooth_customs/${image.filename}`);
                    if (response.ok) {
                        const blob = await response.blob();
                        zip.file(image.filename, blob);
                        successCount++;
                    }
                } catch (e) {
                    console.error(`Failed to add ${image.filename} to ZIP:`, e);
                }
            }
            
            if (successCount === 0) {
                throw new Error('No images could be fetched');
            }
            
            downloadAllBtn.innerHTML = `
                <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/>
                    <path stroke="currentColor" stroke-width="3" stroke-linecap="round" d="M12 2a10 10 0 0 1 10 10">
                        <animateTransform attributeName="transform" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/>
                    </path>
                </svg>
                Creating ZIP...
            `;
            
            const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
            
            const zipName = `photobooth_gallery_${filteredImages.length}_photos.zip`;
            const blobUrl = URL.createObjectURL(zipBlob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = zipName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            
            downloadAllBtn.innerHTML = `
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Downloaded ${successCount} photos
            `;
            setTimeout(() => {
                downloadAllBtn.innerHTML = originalHTML;
                downloadAllBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('ZIP download failed:', error);
            downloadAllBtn.innerHTML = originalHTML;
            downloadAllBtn.disabled = false;
        }
    });
}

// Setup custom modal
function setupModal() {
    const modal = document.getElementById('confirmModal');
    const modalOk = document.getElementById('confirmOk');
    const modalCancel = document.getElementById('confirmCancel');
    const modalOverlay = modal.querySelector('.modal-overlay');
    
    function closeModal(result) {
        modal.classList.add('hidden');
        if (downloadResolve) {
            downloadResolve(result);
            downloadResolve = null;
        }
    }
    
    modalOk.addEventListener('click', () => closeModal(true));
    modalCancel.addEventListener('click', () => closeModal(false));
    modalOverlay.addEventListener('click', () => closeModal(false));
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal(false);
        }
    });
}

// Download a single image
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
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
        console.error('Download failed:', error);
    }
}