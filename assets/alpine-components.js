/**
 * Alpine.js Components for Shopify Theme
 * Production-ready components following OS 2.0 best practices
 *
 * Components:
 * - alpineAnnouncement: Auto-rotating announcement bar with cookie-based dismissal
 * - alpineHeader: Mobile-responsive header with hamburger menu
 */

document.addEventListener('alpine:init', () => {
  // =============================================================================
  // ALPINE HEADER COMPONENT
  // =============================================================================
  /**
   * Alpine Header Component
   * Mobile-responsive header with smart sticky behavior and hamburger menu
   */
  Alpine.data('alpineHeader', (stickyEnabled = true) => ({
    // State
    mobileMenuOpen: false,
    isSticky: false,
    stickyEnabled: stickyEnabled,
    headerOffsetTop: 0,

    // Initialize
    init() {
      // Store initial header position from top of document
      this.$nextTick(() => {
        this.headerOffsetTop = this.$refs.header.offsetTop;
      });

      // Add scroll listener for sticky behavior
      if (this.stickyEnabled) {
        window.addEventListener('scroll', () => this.handleScroll());
      }

      // Close menu on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.mobileMenuOpen) {
          this.closeMobileMenu();
        }
      });
    },

    // Handle scroll for sticky behavior
    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // Header becomes sticky when it reaches the top of the viewport
      this.isSticky = scrollTop >= this.headerOffsetTop;
    },

    // Toggle mobile menu
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;

      // Prevent body scroll when menu is open
      if (this.mobileMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    },

    // Close mobile menu
    closeMobileMenu() {
      this.mobileMenuOpen = false;
      document.body.style.overflow = '';
    },
  }));


  // =============================================================================
  // ALPINE ANNOUNCEMENT COMPONENT
  // =============================================================================
  /**
   * Alpine Announcement Component
   * Auto-rotating announcement bar with cookie-based dismissal
   */
  Alpine.data('alpineAnnouncement', (totalMessages = 1, rotationSpeed = 5000, sectionId = '', showCloseButton = true) => ({
    // State
    currentIndex: 0,
    totalMessages: totalMessages,
    rotationSpeed: rotationSpeed,
    intervalId: null,
    isClosed: false,
    sectionId: sectionId,
    showCloseButton: showCloseButton,

    // Initialize
    init() {
      // Check if announcement was previously closed
      if (this.showCloseButton) {
        this.isClosed = this.getCookie(`announcement-${this.sectionId}-closed`) === 'true';
      }

      // Auto-rotate if multiple messages and not closed
      if (!this.isClosed && this.totalMessages > 1) {
        this.startRotation();
      }
    },

    // Start auto-rotation
    startRotation() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }

      this.intervalId = setInterval(() => {
        this.next();
      }, this.rotationSpeed);
    },

    // Stop auto-rotation
    stopRotation() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    // Navigate to next message
    next() {
      this.currentIndex = (this.currentIndex + 1) % this.totalMessages;
    },

    // Close announcement and set cookie
    closeAnnouncement() {
      this.isClosed = true;
      this.stopRotation();

      // Set cookie to remember dismissal for 30 days
      this.setCookie(`announcement-${this.sectionId}-closed`, 'true', 30);
    },

    // Get cookie by name
    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop().split(';').shift();
      }
      return null;
    },

    // Set cookie with expiration
    setCookie(name, value, days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = `expires=${date.toUTCString()}`;
      document.cookie = `${name}=${value};${expires};path=/`;
    },

    // Cleanup on destroy
    destroy() {
      this.stopRotation();
    },
  }));
});
