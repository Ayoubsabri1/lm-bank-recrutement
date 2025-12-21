// ===== TalentMatch - CV Recommendation System =====

// Counter Animation
function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    });
}

// Intersection Observer for animations
function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Trigger counter animation for stats section
                if (entry.target.classList.contains('stats-section') || 
                    entry.target.classList.contains('hero-stats')) {
                    animateCounters();
                }
            }
        });
    }, observerOptions);
    
    // Observe elements
    document.querySelectorAll('.step-card, .dimension-card, .action-card, .job-card-item, .stat-card, .stats-section, .hero-stats').forEach(el => {
        observer.observe(el);
    });
}

// Smooth scroll for navigation links
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Navbar scroll effect
function setupNavbarEffect() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// Parallel effect for floating shapes
function setupParallax() {
    window.addEventListener('mousemove', (e) => {
        const shapes = document.querySelectorAll('.floating-shape');
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        shapes.forEach((shape, index) => {
            const speed = (index + 1) * 10;
            const xMove = (x - 0.5) * speed;
            const yMove = (y - 0.5) * speed;
            shape.style.transform = `translate(${xMove}px, ${yMove}px)`;
        });
    });
}

// Load jobs from Google Sheets (demo function)
async function loadJobsFromSheet() {
    // This would connect to Google Sheets API in production
    // For demo, we use the static HTML jobs
    console.log('Jobs loaded from demonstration data');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupIntersectionObserver();
    setupSmoothScroll();
    setupNavbarEffect();
    setupParallax();
    loadJobsFromSheet();
    
    console.log('TalentMatch - CV Recommendation System Initialized');
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .step-card, .dimension-card, .action-card, .job-card-item, .stat-card {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    .step-card:nth-child(1) { transition-delay: 0.1s; }
    .step-card:nth-child(2) { transition-delay: 0.2s; }
    .step-card:nth-child(3) { transition-delay: 0.3s; }
    .step-card:nth-child(4) { transition-delay: 0.4s; }
    
    .dimension-card:nth-child(1) { transition-delay: 0.1s; }
    .dimension-card:nth-child(2) { transition-delay: 0.2s; }
    .dimension-card:nth-child(3) { transition-delay: 0.3s; }
    .dimension-card:nth-child(4) { transition-delay: 0.4s; }
    
    .stat-card:nth-child(1) { transition-delay: 0.1s; }
    .stat-card:nth-child(2) { transition-delay: 0.2s; }
    .stat-card:nth-child(3) { transition-delay: 0.3s; }
    .stat-card:nth-child(4) { transition-delay: 0.4s; }
`;
document.head.appendChild(style);
