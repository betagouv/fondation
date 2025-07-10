export let isScrollingToSummarySection = false;
let scrollTimeout: NodeJS.Timeout;

const userScrollEventTypes = ['wheel', 'keydown', 'mousedown', 'touchstart'];

export const summaryScrollListenersFactory = () => ({
  setIsScrolling: () => {
    isScrollingToSummarySection = true;
  },

  createListeners: () => {
    userScrollEventTypes.forEach((eventType) => {
      window.addEventListener(eventType, () => {
        isScrollingToSummarySection = false;
        clearTimeout(scrollTimeout);
      });
    });

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrollingToSummarySection = false;
      }, 100);
    });
  },

  removeListeners: () => {
    userScrollEventTypes.forEach((eventType) => {
      window.removeEventListener(eventType, () => {
        clearTimeout(scrollTimeout);
      });
    });
    window.removeEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      isScrollingToSummarySection = false;
    });
  }
});
