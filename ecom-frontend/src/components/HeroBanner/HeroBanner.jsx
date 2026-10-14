import { useContext } from 'react';
import { Box, Typography } from '@mui/material';
import { AppContext } from '../../context/AppContext';
import './HeroBanner.css';

const HeroBanner = () => {
  const { t } = useContext(AppContext);
  return (
    <Box className="hero-banner-container">
      <Box className="hero-content">
        <Box className="hero-text-section">
          <Typography className="hero-title">
            {t('heroTitle')}
          </Typography>
          <Typography className="hero-subtitle">
            {t('heroSubtitle')}
          </Typography>
        </Box>
        <Box className="hero-image-section">
          {/* Placeholder for the banner image */}
          <Box className="banner-image-placeholder">
            <Typography variant="body2" color="textSecondary">Banner Image Placeholder</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HeroBanner;
