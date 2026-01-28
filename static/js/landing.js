/**
 * Landing Page Logic - New Haven Hangouts
 * Handles swiping, animations, and transitions for the onboarding flow.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Only show if not seen before (can use localStorage)
    if (localStorage.getItem('onboarding_seen')) {
        // remove overlay if it exists (though ideally it shouldn't be rendered)
        const overlay = document.getElementById('landing-overlay');
        if (overlay) overlay.remove();
        return;
    }

    const swiper = document.getElementById('landing-swiper');
    const dots = document.querySelectorAll('.dot');
    const getStartedBtn = document.getElementById('get-started-btn');

    let startX = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;
    let currentIndex = 0;
    const slidesCount = 4;

    // Touch Events
    swiper.addEventListener('touchstart', touchStart);
    swiper.addEventListener('touchend', touchEnd);
    swiper.addEventListener('touchmove', touchMove);

    // Mouse Events (for Testing)
    swiper.addEventListener('mousedown', touchStart);
    swiper.addEventListener('mouseup', touchEnd);
    swiper.addEventListener('mouseleave', touchEnd);
    swiper.addEventListener('mousemove', touchMove);

    function touchStart(event) {
        startX = getPositionX(event);
        swiper.style.transition = 'none';
        animationID = requestAnimationFrame(animation);
    }

    function touchMove(event) {
        if (startX === 0) return;
        const currentX = getPositionX(event);
        const diff = currentX - startX;
        currentTranslate = prevTranslate + diff;
    }

    function touchEnd() {
        cancelAnimationFrame(animationID);
        const movedBy = currentTranslate - prevTranslate;

        // If moved more than 100px, change slide
        if (movedBy < -100 && currentIndex < slidesCount - 1) {
            currentIndex += 1;
        } else if (movedBy > 100 && currentIndex > 0) {
            currentIndex -= 1;
        }

        setPositionByIndex();
        startX = 0;
    }

    function getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }

    function animation() {
        setSwiperPosition();
        if (startX !== 0) requestAnimationFrame(animation);
    }

    function setSwiperPosition() {
        swiper.style.transform = `translateX(${currentTranslate}px)`;
    }

    function setPositionByIndex() {
        currentTranslate = currentIndex * -window.innerWidth;
        prevTranslate = currentTranslate;
        setSwiperPosition();
        swiper.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
        updateDots();
    }

    function updateDots() {
        dots.forEach((dot, index) => {
            if (index === currentIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    // Handle Resize
    window.addEventListener('resize', setPositionByIndex);

    // Get Started Action
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            localStorage.setItem('onboarding_seen', 'true');

            // Fade out overlay
            const overlay = document.getElementById('landing-overlay');
            overlay.style.transition = 'opacity 0.8s ease-out';
            overlay.style.opacity = '0';

            setTimeout(() => {
                overlay.remove();
                // Trigger original app signup modal if it exists
                if (typeof openSignupModal === 'function') {
                    openSignupModal();
                } else {
                    // Fallback: show the login/signup section in app.js
                    const signupSection = document.getElementById('signup-section');
                    if (signupSection) signupSection.style.display = 'block';
                }
            }, 800);
        });
    }
});
