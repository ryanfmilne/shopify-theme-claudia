/**
 * Alpine.js Components for Shopify Theme
 * Production-ready components following OS 2.0 best practices
 *
 * Components:
 * - cartDrawer: Cart drawer with live updates from Cart API
 * - mobileMenu: Mobile navigation with body scroll lock
 * - productGallery: Product image gallery with navigation
 */

document.addEventListener('alpine:init', () => {
  /**
   * Cart Drawer Component
   * Handles cart state, opening/closing, and refreshing cart data from Shopify Cart API
   */
  Alpine.data('cartDrawer', () => ({
    // State
    isOpen: false,
    isLoading: false,
    cart: null,
    error: null,

    // Initialize
    init() {
      // Listen for cart:add custom events from add-to-cart buttons
      window.addEventListener('cart:add', (event) => {
        this.refreshCart();
        this.open();
      });

      // Listen for cart:update events
      window.addEventListener('cart:update', () => {
        this.refreshCart();
      });

      // Load cart on init
      this.refreshCart();
    },

    // Open cart drawer
    open() {
      this.isOpen = true;
      document.body.classList.add('overflow-hidden');
    },

    // Close cart drawer
    close() {
      this.isOpen = false;
      document.body.classList.remove('overflow-hidden');
    },

    // Toggle cart drawer
    toggle() {
      this.isOpen ? this.close() : this.open();
    },

    // Refresh cart data from Shopify Cart API
    async refreshCart() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch('/cart.js', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        this.cart = await response.json();
      } catch (error) {
        console.error('Error fetching cart:', error);
        this.error = 'Unable to load cart. Please refresh the page.';
      } finally {
        this.isLoading = false;
      }
    },

    // Update item quantity
    async updateQuantity(lineItemKey, quantity) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: lineItemKey,
            quantity: quantity,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedCart = await response.json();
        this.cart = updatedCart;

        // Dispatch event for other components to listen
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: updatedCart }));
      } catch (error) {
        console.error('Error updating cart:', error);
        this.error = 'Unable to update cart. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },

    // Remove item from cart
    async removeItem(lineItemKey) {
      await this.updateQuantity(lineItemKey, 0);
    },

    // Format money using Shopify's money format
    formatMoney(cents) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(cents / 100);
    },
  }));

  /**
   * Mobile Menu Component
   * Handles mobile navigation with body scroll lock
   */
  Alpine.data('mobileMenu', () => ({
    // State
    isOpen: false,

    // Open mobile menu
    open() {
      this.isOpen = true;
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
    },

    // Close mobile menu
    close() {
      this.isOpen = false;
      // Unlock body scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    },

    // Toggle mobile menu
    toggle() {
      this.isOpen ? this.close() : this.open();
    },

    // Get scrollbar width to prevent layout shift
    getScrollbarWidth() {
      return window.innerWidth - document.documentElement.clientWidth;
    },

    // Close on escape key
    handleEscape(event) {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    },
  }));

  /**
   * Product Gallery Component
   * Image switcher with next/previous navigation and thumbnail selection
   */
  Alpine.data('productGallery', (images = []) => ({
    // State
    currentIndex: 0,
    images: images,

    // Get current image
    get currentImage() {
      return this.images[this.currentIndex] || null;
    },

    // Check if there are multiple images
    get hasMultipleImages() {
      return this.images.length > 1;
    },

    // Check if at first image
    get isFirst() {
      return this.currentIndex === 0;
    },

    // Check if at last image
    get isLast() {
      return this.currentIndex === this.images.length - 1;
    },

    // Navigate to next image
    next() {
      if (!this.isLast) {
        this.currentIndex++;
      } else {
        // Loop back to first image
        this.currentIndex = 0;
      }
    },

    // Navigate to previous image
    previous() {
      if (!this.isFirst) {
        this.currentIndex--;
      } else {
        // Loop to last image
        this.currentIndex = this.images.length - 1;
      }
    },

    // Go to specific image by index
    goTo(index) {
      if (index >= 0 && index < this.images.length) {
        this.currentIndex = index;
      }
    },

    // Handle keyboard navigation
    handleKeydown(event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.previous();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.next();
      }
    },
  }));

  /**
   * Alpine Announcement Component
   * Auto-rotating announcement bar (when multiple messages exist)
   * Supports pause on hover, keyboard controls, and cookie-based dismissal
   */
  Alpine.data('alpineAnnouncement', (totalMessages = 1, rotationSpeed = 5000, sectionId = '', showCloseButton = true) => ({
    // State
    currentIndex: 0,
    totalMessages: totalMessages,
    rotationSpeed: rotationSpeed,
    intervalId: null,
    isPaused: false,
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

      // Keyboard navigation
      this.$el.addEventListener('keydown', (e) => this.handleKeydown(e));
    },

    // Start auto-rotation
    startRotation() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }

      this.intervalId = setInterval(() => {
        if (!this.isPaused) {
          this.next();
        }
      }, this.rotationSpeed);
    },

    // Stop auto-rotation
    stopRotation() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    // Pause rotation (on hover)
    pauseRotation() {
      this.isPaused = true;
    },

    // Resume rotation (on mouse leave)
    resumeRotation() {
      this.isPaused = false;
    },

    // Navigate to next message
    next() {
      this.currentIndex = (this.currentIndex + 1) % this.totalMessages;
    },

    // Navigate to previous message
    previous() {
      this.currentIndex = (this.currentIndex - 1 + this.totalMessages) % this.totalMessages;
    },

    // Go to specific message by index
    goTo(index) {
      if (index >= 0 && index < this.totalMessages) {
        this.currentIndex = index;

        // Reset rotation timer when manually navigating (only if multiple messages)
        if (this.totalMessages > 1) {
          this.stopRotation();
          this.startRotation();
        }
      }
    },

    // Handle keyboard navigation
    handleKeydown(event) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.previous();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.next();
      } else if (event.key >= '1' && event.key <= '3') {
        // Number keys 1-3 for direct navigation
        const index = parseInt(event.key) - 1;
        if (index < this.totalMessages) {
          event.preventDefault();
          this.goTo(index);
        }
      }
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
