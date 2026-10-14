import { useContext, useRef, useState, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import './ProductSection.css';
import { AppContext } from '../../context/AppContext';

const ProductSection = ({ title, subtitle, children, hasViewAll = true, onViewAll }) => {
  const { t } = useContext(AppContext);
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    // Initial check after children render
    const timeout = setTimeout(handleScroll, 100);
    window.addEventListener('resize', handleScroll);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', handleScroll);
    };
  }, [children]);

  const scroll = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <Box className="product-section">
      <Box className="section-header">
        <Box>
          <Typography className="section-title">{title}</Typography>
          {subtitle && <Typography className="section-subtitle">{subtitle}</Typography>}
        </Box>
        {hasViewAll && onViewAll && <Typography role="button" tabIndex={0} onClick={onViewAll} onKeyDown={(event) => event.key === 'Enter' && onViewAll()} sx={{ cursor: 'pointer' }}>{t('viewAll')}</Typography>}
      </Box>
      <Box className="section-content-wrapper">
        {showLeftArrow && (
          <IconButton className="scroll-arrow scroll-arrow-left" onClick={() => scroll(-250)}>
            <KeyboardArrowLeftIcon />
          </IconButton>
        )}
        <Box className="section-content" ref={scrollRef} onScroll={handleScroll}>
          {children}
        </Box>
        {showRightArrow && (
          <IconButton className="scroll-arrow scroll-arrow-right" onClick={() => scroll(250)}>
            <KeyboardArrowRightIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default ProductSection;
