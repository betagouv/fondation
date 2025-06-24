export const scrollToSummarySection = () => {
  if (window.location.hash) {
    // Remove '#' from the hash
    const targetId = window.location.hash.substring(1);
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: "instant" });
  }
};
