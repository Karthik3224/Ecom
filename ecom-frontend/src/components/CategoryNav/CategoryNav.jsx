import { useContext } from 'react';
import { Box, Typography } from '@mui/material';
import AllInclusiveOutlinedIcon from '@mui/icons-material/AllInclusiveOutlined';
import RiceBowlOutlinedIcon from '@mui/icons-material/RiceBowlOutlined';
import SoupKitchenOutlinedIcon from '@mui/icons-material/SoupKitchenOutlined';
import TakeoutDiningOutlinedIcon from '@mui/icons-material/TakeoutDiningOutlined';
import BakeryDiningOutlinedIcon from '@mui/icons-material/BakeryDiningOutlined';
import GrainOutlinedIcon from '@mui/icons-material/GrainOutlined';
import { AppContext } from '../../context/AppContext';
import './CategoryNav.css';

const CategoryNav = () => {
  const { selectedCategory, setSelectedCategory, catalogCategories, t } = useContext(AppContext);

  const defaultCategories = [
    { name: 'All', icon: <AllInclusiveOutlinedIcon fontSize="medium" /> },
    { name: 'Whole Masala', icon: <RiceBowlOutlinedIcon fontSize="medium" /> },
    { name: 'Masalas', icon: <SoupKitchenOutlinedIcon fontSize="medium" /> },
    { name: 'Pickles', icon: <TakeoutDiningOutlinedIcon fontSize="medium" /> },
    { name: 'Spice powder', icon: <BakeryDiningOutlinedIcon fontSize="medium" /> },
    { name: 'Dry Fruits', icon: <GrainOutlinedIcon fontSize="medium" /> },
  ];
  const iconFor = (name) => defaultCategories.find((item) => item.name === name)?.icon || <GrainOutlinedIcon fontSize="medium" />;
  const categories = [
    defaultCategories[0],
    ...catalogCategories.map((category) => ({ name: category.name || category.title, icon: iconFor(category.name || category.title) })),
  ];

  return (
    <Box className="category-nav-container">
      {categories.map((cat, index) => {
        const isSelected = selectedCategory === cat.name;
        return (
          <Box
            key={index}
            className={`category-nav-item ${isSelected ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.name)}
          >
            <Box className="category-icon-box">{cat.icon}</Box>
            <Typography className="category-label">{{ All: t('all'), 'Traditional Pickles': t('traditionalPickles'), 'Premium Dry Fruits': t('premiumDryFruits'), 'Fresh Vegetables': t('freshVegetables'), 'Fresh Non-Veg': t('freshNonVeg') }[cat.name] || cat.name}</Typography>
            {isSelected && <Box className="active-indicator" />}
          </Box>
        );
      })}
    </Box>
  );
};

export default CategoryNav;
