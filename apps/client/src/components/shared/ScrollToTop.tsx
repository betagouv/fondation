import { useState, useEffect } from 'react';
import { Badge } from '@codegouvfr/react-dsfr/Badge';
import clsx from 'clsx';

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div
      className={clsx(
        'fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out',
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      )}
    >
      <div
        onClick={scrollToTop}
        className="cursor-pointer shadow-lg transition-shadow duration-200 hover:shadow-xl"
        title="Retour en haut"
        role="button"
      >
        <Badge>↑ Retour en haut de page</Badge>
      </div>
    </div>
  );
};
