/* =========================================================================
   Zamil's Portfolio Script File
   Core Interactions: Sticky Nav, Mobile Menu, Scroll Spy, Typewriter Loop, Form Simulation
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Sticky Navigation Header ---
    const navbar = document.getElementById('navbar');
    
    const handleScrollNavbar = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScrollNavbar);
    handleScrollNavbar(); // Initial check on load


    // --- 2. Mobile Responsive Menu ---
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    const navLinkItems = document.querySelectorAll('.nav-link');

    const toggleMenu = () => {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        // Prevent scroll behind the menu when open
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : 'auto';
    };

    menuToggle.addEventListener('click', toggleMenu);

    // Close menu when clicking on any link
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                toggleMenu();
            }
        });
    });


    // --- 3. Scroll Spy (Highlight active nav link on scroll) ---
    const sections = document.querySelectorAll('section, header');
    
    const scrollSpy = () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 120; // Offset for navbar height

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinkItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', scrollSpy);
    scrollSpy(); // Initial call


    // --- 4. Micro Typewriter Effect for Hero Subtitle ---
    const words = [
        "Content Creator",
        "Video Editor",
        "Minecraft Gamer",
        "STEM Student"
    ];
    
    const typedTextElement = document.querySelector('.typed-text');
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    const typeEffect = () => {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            // Remove character
            typedTextElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50; // Delete faster
        } else {
            // Add character
            typedTextElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 120; // Natural typing speed
        }

        // Word completed
        if (!isDeleting && charIndex === currentWord.length) {
            typingSpeed = 2000; // Pause at end of word
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length; // Move to next word
            typingSpeed = 500; // Pause before typing new word
        }

        setTimeout(typeEffect, typingSpeed);
    };

    if (typedTextElement) {
        typeEffect(); // Start effect
    }


    // --- 5. Intersection Observer Scroll Reveal ---
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, {
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });


    // --- 6. Contact Form Mockup Submission ---
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Stop normal form post
            
            // Set loading status
            formStatus.className = 'form-status';
            formStatus.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending message...';
            
            // Mocking API post call delay
            setTimeout(() => {
                // Generate form values (for editing if needed)
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const message = document.getElementById('message').value;
                
                // Show success status
                formStatus.className = 'form-status success';
                formStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Thank you! Message sent successfully.';
                
                // Clear fields
                contactForm.reset();
                
                // Clear message status after 5 seconds
                setTimeout(() => {
                    formStatus.innerHTML = '';
                }, 5000);
                
            }, 1500);
        });
    }

});
