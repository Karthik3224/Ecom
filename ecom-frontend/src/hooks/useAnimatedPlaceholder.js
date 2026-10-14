import { useState, useEffect } from 'react';

const categoryNames = [
  '"Whole Masala"',
  '"Masalas"',
  '"Pickles"',
  '"Spice Powder"',
  '"Dry Fruits"',
];

export const useAnimatedPlaceholder = () => {
  const [categoryText, setCategoryText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentCategory = categoryNames[phraseIndex];

    let typingSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentCategory.length) typingSpeed = 2200;
    if (isDeleting && charIndex === 0) typingSpeed = 300;

    const timer = setTimeout(() => {
      if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % categoryNames.length);
      } else if (!isDeleting && charIndex < currentCategory.length) {
        setCategoryText(currentCategory.substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      } else if (isDeleting && charIndex > 0) {
        setCategoryText(currentCategory.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
      } else if (!isDeleting && charIndex === currentCategory.length) {
        setIsDeleting(true);
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex]);

  return `Search for ${categoryText}`;
};
