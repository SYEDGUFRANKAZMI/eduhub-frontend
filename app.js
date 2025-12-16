// Configuration - Updated to use deployed backend
const API_URL = 'https://backend-o9o2.onrender.com/api';
let courses = [];
let notes = [];
let categories = new Set();
let notifications = [];
let userStats = {
    views: 0,
    downloads: 0,
    timeSpent: 0,
    progress: 0
};

// DOM Elements
const liveCourses = document.getElementById('liveCourses');
const statusDot = document.getElementById('statusDot');
const typingText = document.getElementById('typingText');
const coursesGrid = document.getElementById('coursesGrid');
const categoryFilter = document.getElementById('categoryFilter');
const connectionStatus = document.getElementById('connectionStatus');
const loadingScreen = document.getElementById('loadingScreen');
const notificationCenter = document.getElementById('notificationCenter');
const notificationsList = document.getElementById('notificationsList');
const notificationCount = document.getElementById('notificationCount');

// Typing Animation
const typingWords = ['Learning', 'Future', 'Skills', 'Knowledge'];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;
let isEnd = false;

function typeText() {
    const currentWord = typingWords[wordIndex];
    
    if (isDeleting) {
        typingText.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingText.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
    }
    
    if (!isDeleting && charIndex === currentWord.length) {
        isEnd = true;
        isDeleting = true;
        setTimeout(typeText, 1500);
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % typingWords.length;
        setTimeout(typeText, 500);
    } else {
        const speed = isDeleting ? 100 : 150;
        setTimeout(typeText, isEnd ? speed * 2 : speed);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 EduHub Pro Initialized - Backend: ' + API_URL);
    
    // Start typing animation
    typeText();
    
    // Start loading animation
    simulateLoading();
    
    // Auto connect
    setTimeout(() => {
        connectPlatform();
    }, 2000);
    
    // Add some sample notifications
    addNotification('Welcome to EduHub Pro!', 'info');
    addNotification('System is initializing...', 'warning');
});

// Simulate loading animation
function simulateLoading() {
    const progressBar = document.getElementById('loadingProgress');
    const loadingText = document.getElementById('loadingText');
    const steps = [
        { text: 'Initializing core systems...', progress: 25 },
        { text: 'Connecting to backend server...', progress: 50 },
        { text: 'Loading user interface...', progress: 75 },
        { text: 'Finalizing setup...', progress: 95 }
    ];
    
    let step = 0;
    
    const interval = setInterval(() => {
        if (step < steps.length) {
            loadingText.textContent = steps[step].text;
            progressBar.style.width = steps[step].progress + '%';
            step++;
        } else {
            clearInterval(interval);
        }
    }, 800);
}

// Connect to platform
async function connectPlatform() {
    updateConnectionStatus('Connecting to backend...', 'connecting');
    showLoading(true);
    
    try {
        console.log('🌐 Connecting to:', API_URL + '/courses');
        const response = await fetch(`${API_URL}/courses`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📦 Backend response:', result);
        
        // Handle different response formats
        let coursesData = [];
        
        if (result && result.success !== undefined) {
            // Format: { success: true, data: [...] }
            if (result.success && Array.isArray(result.data)) {
                coursesData = result.data;
            } else {
                throw new Error(result.error || 'Backend returned unsuccessful');
            }
        } else if (Array.isArray(result)) {
            // Format: [...] (direct array)
            coursesData = result;
        } else {
            // Try to find courses in any property
            const possibleArrays = Object.values(result).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
                coursesData = possibleArrays[0];
            } else {
                throw new Error('Invalid response format from backend');
            }
        }
        
        courses = coursesData;
        
        // Update UI
        updateConnectionStatus('Connected successfully!', 'connected');
        updateLiveStats();
        displayCourses(courses);
        populateCategoryFilter();
        addNotification(`Connected to backend. Found ${courses.length} courses`, 'success');
        
        // Hide loading screen
        setTimeout(() => {
            showLoading(false);
            addNotification('Platform ready! Start learning now.', 'success');
        }, 1000);
        
    } catch (error) {
        console.error('❌ Connection failed:', error);
        updateConnectionStatus('Connection failed', 'error');
        addNotification(`Failed to connect: ${error.message}`, 'error');
        showLoading(false);
        
        // Show retry option
        setTimeout(() => {
            coursesGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-unlink"></i>
                    </div>
                    <h4>Connection Failed</h4>
                    <p>Unable to reach: ${API_URL}</p>
                    <p style="font-size: 12px; color: #ef4444; margin: 10px 0;">${error.message}</p>
                    <button class="btn-connect-large" onclick="connectPlatform()">
                        <i class="fas fa-redo"></i> Retry Connection
                    </button>
                    <p style="margin-top: 15px; font-size: 14px; color: #94a3b8;">
                        Ensure your backend is running and CORS is enabled.
                    </p>
                </div>
            `;
        }, 500);
    }
}

// Scan for courses
async function scanCourses() {
    addNotification('Scanning for available courses...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/courses`);
        const result = await response.json();
        
        let coursesData = [];
        
        // Handle different response formats
        if (result && result.success !== undefined) {
            if (result.success && Array.isArray(result.data)) {
                coursesData = result.data;
            } else {
                throw new Error(result.error || 'Backend returned unsuccessful');
            }
        } else if (Array.isArray(result)) {
            coursesData = result;
        }
        
        if (coursesData.length > courses.length) {
            courses = coursesData;
            displayCourses(courses);
            addNotification(`Found ${coursesData.length} courses`, 'success');
        } else {
            addNotification('No new courses found', 'info');
        }
    } catch (error) {
        addNotification('Scan failed: ' + error.message, 'error');
    }
}

// Display courses
function displayCourses(coursesToShow) {
    // Ensure coursesToShow is an array
    if (!Array.isArray(coursesToShow)) {
        console.error('coursesToShow is not an array:', coursesToShow);
        coursesToShow = [];
    }
    
    if (coursesToShow.length === 0) {
        coursesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-book"></i>
                </div>
                <h4>No Courses Available</h4>
                <p>No courses found in the database</p>
                <button class="btn-connect-large" onclick="connectPlatform()">
                    <i class="fas fa-sync"></i> Refresh
                </button>
            </div>
        `;
        return;
    }
    
    const coursesHTML = coursesToShow.map((course, index) => {
        // Safely handle course properties
        const courseNotes = notes.filter(n => n.courseId === course.id);
        const title = course.title || 'Untitled Course';
        const category = course.category || 'Uncategorized';
        const description = course.description || 'No description available for this course.';
        const createdDate = course.createdDate || course.created || new Date().toISOString();
        const isActive = course.isActive !== false;
        
        return `
            <div class="course-card" style="animation-delay: ${index * 0.1}s">
                <div class="course-header">
                    <div>
                        <h3 class="course-title">${title}</h3>
                        <span class="course-category">${category}</span>
                    </div>
                    <div class="course-badge">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                </div>
                <p class="course-description">
                    ${description}
                </p>
                <div class="course-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(createdDate)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-file-alt"></i>
                        <span>${courseNotes.length || 0} notes</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-${isActive ? 'check-circle' : 'times-circle'}"></i>
                        <span>${isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
                <div class="course-actions">
                    <button class="course-btn primary" onclick="viewCourseDetails(${course.id || index})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="course-btn secondary" onclick="loadCourseNotes(${course.id || index})">
                        <i class="fas fa-download"></i> Notes
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    coursesGrid.innerHTML = coursesHTML;
    
    // Add fade-in animation
    document.querySelectorAll('.course-card').forEach((card, index) => {
        card.style.animation = `fadeIn 0.5s ease ${index * 0.1}s both`;
    });
}

// Populate category filter
function populateCategoryFilter() {
    // Extract categories from courses
    const allCategories = courses
        .map(c => c.category)
        .filter(cat => cat && typeof cat === 'string')
        .filter((cat, index, arr) => arr.indexOf(cat) === index)
        .sort();
    
    categories = new Set(allCategories);
    
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    
    Array.from(categories).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    categoryFilter.onchange = function() {
        const selected = this.value;
        if (selected === 'all') {
            displayCourses(courses);
        } else {
            const filtered = courses.filter(c => c.category === selected);
            displayCourses(filtered);
        }
    };
}

// Search courses
function searchContent(query) {
    if (!query || !query.trim()) {
        displayCourses(courses);
        return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    const searchResults = courses.filter(course => {
        const title = (course.title || '').toLowerCase();
        const description = (course.description || '').toLowerCase();
        const category = (course.category || '').toLowerCase();
        
        return title.includes(searchTerm) ||
               description.includes(searchTerm) ||
               category.includes(searchTerm);
    });
    
    displayCourses(searchResults);
}

// View course details
async function viewCourseDetails(courseId) {
    try {
        const response = await fetch(`${API_URL}/courses/${courseId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        let course;
        
        // Handle different response formats
        if (result && result.success !== undefined && result.data) {
            course = result.data;
        } else {
            course = result;
        }
        
        if (!course) throw new Error('Course not found');
        
        // Update stats
        userStats.views++;
        updateStats();
        
        // Show course details
        const title = course.title || 'Untitled Course';
        const category = course.category || 'Uncategorized';
        const createdDate = course.createdDate || course.created || 'Unknown';
        const isActive = course.isActive !== false;
        const description = course.description || 'No description available';
        
        alert(`
            📚 ${title}
            📁 ${category}
            📅 Created: ${formatDate(createdDate)}
            🔄 Status: ${isActive ? 'Active' : 'Inactive'}
            
            ${description}
        `);
        
        addNotification(`Viewed course: ${title}`, 'info');
        
    } catch (error) {
        addNotification('Failed to load course details: ' + error.message, 'error');
    }
}

// Load course notes
async function loadCourseNotes(courseId) {
    try {
        const response = await fetch(`${API_URL}/courses/${courseId}/notes`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        let courseNotes = [];
        
        // Handle different response formats
        if (result && result.success !== undefined && result.data) {
            courseNotes = result.data;
        } else if (Array.isArray(result)) {
            courseNotes = result;
        }
        
        if (courseNotes.length === 0) {
            alert('No notes available for this course');
            return;
        }
        
        // Update stats
        userStats.downloads++;
        updateStats();
        
        const notesList = courseNotes.map((note, index) => {
            const title = note.title || `Note ${index + 1}`;
            const size = note.fileSize ? formatFileSize(note.fileSize) : 'Unknown size';
            return `${index + 1}. ${title} (${size})`;
        }).join('\n');
        
        alert(`📝 Course Notes:\n\n${notesList}`);
        
        addNotification(`Loaded ${courseNotes.length} notes`, 'success');
        
    } catch (error) {
        addNotification('Failed to load notes: ' + error.message, 'error');
    }
}

// Update connection status
function updateConnectionStatus(text, status) {
    const statusContent = connectionStatus.querySelector('.status-content');
    const statusDot = statusContent.querySelector('.status-dot');
    const statusText = statusContent.querySelector('.status-text');
    
    statusText.textContent = text;
    statusDot.className = 'status-dot';
    
    switch(status) {
        case 'connected':
            statusDot.classList.add('connected');
            statusDot.style.animation = 'pulse 1s infinite';
            break;
        case 'error':
            statusDot.classList.add('error');
            statusDot.style.animation = 'none';
            break;
        case 'connecting':
            statusDot.style.animation = 'pulse 0.5s infinite';
            break;
    }
    
    if (status === 'connected') {
        setTimeout(() => {
            connectionStatus.style.opacity = '0';
            setTimeout(() => connectionStatus.style.display = 'none', 300);
        }, 5000);
    } else {
        connectionStatus.style.display = 'block';
        connectionStatus.style.opacity = '1';
    }
}

// Update live stats
function updateLiveStats() {
    liveCourses.textContent = courses.length;
    statusDot.textContent = '●';
    statusDot.style.color = '#10b981';
}

// Update stats display
function updateStats() {
    document.getElementById('totalViews').textContent = userStats.views;
    document.getElementById('totalDownloads').textContent = userStats.downloads;
    document.getElementById('timeSpent').textContent = `${Math.floor(userStats.timeSpent / 60)}h`;
    document.getElementById('progressPercent').textContent = `${userStats.progress}%`;
    
    // Update circular progress
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const circumference = 339;
        const offset = circumference - (userStats.progress / 100) * circumference;
        progressBar.style.strokeDashoffset = offset;
    }
}

// Add notification
function addNotification(message, type = 'info') {
    const notification = {
        id: Date.now(),
        message,
        type,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        read: false
    };
    
    notifications.unshift(notification);
    updateNotificationUI();
    
    // Show notification center temporarily
    notificationCenter.classList.add('show');
    setTimeout(() => {
        notificationCenter.classList.remove('show');
    }, 5000);
}

// Update notification UI
function updateNotificationUI() {
    if (!notificationCount || !notificationsList) return;
    
    notificationCount.textContent = notifications.length;
    
    // Show only latest 5 notifications
    const latestNotifications = notifications.slice(0, 5);
    
    notificationsList.innerHTML = latestNotifications.map(notification => `
        <div class="notification-item ${notification.read ? '' : 'unread'}">
            <p>${notification.message}</p>
            <div class="time">${notification.time}</div>
        </div>
    `).join('');
}

// Show/hide loading screen
function showLoading(show) {
    if (!loadingScreen) return;
    
    if (show) {
        loadingScreen.style.display = 'flex';
        setTimeout(() => {
            loadingScreen.style.opacity = '1';
        }, 10);
    } else {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

// Toggle theme
function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('light-theme');
    
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-palette';
    }
    
    addNotification(`Switched to ${isDark ? 'light' : 'dark'} theme`, 'info');
}

// Launch dashboard
function launchDashboard() {
    addNotification('Dashboard launched successfully!', 'success');
    
    // Scroll to courses panel
    const coursesPanel = document.querySelector('.courses-panel');
    if (coursesPanel) {
        coursesPanel.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Explore features
function exploreFeatures() {
    const features = [
        '🔍 Smart Search',
        '📊 Real-time Analytics',
        '📱 Responsive Design',
        '🎯 Course Filtering',
        '📈 Progress Tracking',
        '🔔 Smart Notifications'
    ];
    
    alert(`🌟 Platform Features:\n\n${features.join('\n')}`);
    addNotification('Exploring platform features', 'info');
}

// Export data
function exportData() {
    const data = {
        courses,
        notes,
        userStats,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduhub-data-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addNotification('Data exported successfully', 'success');
}

// Format date
function formatDate(dateString) {
    try {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return 'Unknown date';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('courseSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchContent(e.target.value);
        });
    }
});

// Utility functions
function refreshCourses() {
    connectPlatform();
}

function downloadAllNotes() {
    addNotification('Preparing all notes for download...', 'info');
}

function bookmarkCourses() {
    addNotification('Course bookmarked', 'success');
}

function sharePlatform() {
    if (navigator.share) {
        navigator.share({
            title: 'EduHub Pro',
            text: 'Check out this amazing learning platform!',
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href)
            .then(() => addNotification('Link copied to clipboard', 'success'))
            .catch(() => addNotification('Failed to copy link', 'error'));
    }
}

function showAnalytics() {
    addNotification('Opening analytics dashboard...', 'info');
}


window.connectPlatform = connectPlatform;
window.scanCourses = scanCourses;
window.viewCourseDetails = viewCourseDetails;
window.loadCourseNotes = loadCourseNotes;
window.toggleTheme = toggleTheme;
window.launchDashboard = launchDashboard;
window.exploreFeatures = exploreFeatures;
window.refreshCourses = refreshCourses;
window.downloadAllNotes = downloadAllNotes;
window.bookmarkCourses = bookmarkCourses;
window.sharePlatform = sharePlatform;
window.showAnalytics = showAnalytics;
window.exportData = exportData;
window.searchContent = searchContent;