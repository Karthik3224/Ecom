import { useState, useContext } from 'react';
import { Box, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import { AppContext } from '../../context/AppContext';
import './CategoriesPage.css';

import mangoPickleImg from '../../assets/images/mango_pickle_jar.png';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const { setSelectedCategory, catalogCategories } = useContext(AppContext);

  const [expandedCategory, setExpandedCategory] = useState('Pickles');

  const categoryList = catalogCategories.map((category) => ({
    id: category.id || category.slug || category.name,
    title: category.title || category.name || 'Category',
    subtitle: category.description || 'Authentic products curated for you.',
    mainImage: category.image || category.thumbnail || mangoPickleImg,
    subcategories: [{ name: category.title || category.name || 'Category', image: category.image || category.thumbnail || mangoPickleImg, categoryKey: category.name || category.title || 'Category' }],
  }));

  const handleToggle = (title) => {
    setExpandedCategory((prev) => (prev === title ? null : title));
  };

  const handleSubcategoryClick = (catKey) => {
    setSelectedCategory(catKey);
    navigate('/home');
  };

  return (
    <Box className="categories-page-container">
      <Header />
      <Box className="categories-content-scroll">
        <Typography className="all-categories-title">All categories</Typography>

        <Box className="categories-list">
          {categoryList.map((cat) => {
            const isExpanded = expandedCategory === cat.title;

            return (
              <Box key={cat.id} className="category-accordion-item">
                <Box
                  className="category-header-row"
                  onClick={() => handleToggle(cat.title)}
                >
                  <img
                    src={cat.mainImage}
                    alt={cat.title}
                    className="category-main-thumb"
                  />
                  <Box className="category-text-wrap">
                    <Typography className="category-item-title">
                      {cat.title}
                    </Typography>
                    <Typography className="category-item-subtitle">
                      {cat.subtitle}
                    </Typography>
                  </Box>
                  <Box className="category-chevron">
                    {isExpanded ? (
                      <KeyboardArrowUpIcon style={{ color: '#64748b' }} />
                    ) : (
                      <KeyboardArrowDownIcon style={{ color: '#64748b' }} />
                    )}
                  </Box>
                </Box>

                {isExpanded && (
                  <Box className="subcategory-grid">
                    {cat.subcategories.map((sub, idx) => (
                      <Box
                        key={idx}
                        className="subcategory-item"
                        onClick={() => handleSubcategoryClick(sub.categoryKey)}
                      >
                        <Box className="subcategory-circle-box">
                          <img
                            src={sub.image}
                            alt={sub.name}
                            className="subcategory-circle-img"
                          />
                        </Box>
                        <Typography className="subcategory-name-text">
                          {sub.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
      <BottomNav />
    </Box>
  );
};

export default CategoriesPage;
