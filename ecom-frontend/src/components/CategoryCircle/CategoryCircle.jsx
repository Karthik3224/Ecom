import { Box, Typography } from '@mui/material';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import './CategoryCircle.css';

const CategoryCircle = ({ title, image, onClick }) => {
  const { t } = useContext(AppContext);
  const label = { 'Traditional Pickles': t('traditionalPickles'), 'Premium Dry Fruits': t('premiumDryFruits'), 'Fresh Vegetables': t('freshVegetables'), 'Fresh Non-Veg': t('freshNonVeg') }[title] || title;
  return (
    <Box className="category-circle-container" onClick={onClick} style={{ cursor: 'pointer' }}>
      <Box className="category-circle">
        {image ? <img src={image} alt={title} className="category-circle-img" /> : <Box className="category-circle-img category-circle-img-empty">No image</Box>}
      </Box>
      <Typography className="category-circle-title">{label}</Typography>
    </Box>
  );
};

export default CategoryCircle;
