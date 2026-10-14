import { useState, useContext, useEffect, useMemo, useRef } from 'react';
import { Box, Typography, Button, Chip, IconButton, InputBase, MenuItem, Rating, Select } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { collectionStore } from '../../services/localDataService';
import { getProducts } from '../../services/catalogApi';
import { adaptProductList } from '../../services/catalogAdapter';
import { deliverySummary, deliveryProducts } from '../../utils/storeDelivery';
import SafeProductImage from '../../components/SafeProductImage/SafeProductImage';
import './SearchPage.css';

const SearchPage = () => {
  const navigate = useNavigate();
  const { addToCart, setSelectedProduct, formatCurrency, catalogProducts, catalogCategories, catalogStoreProducts, selectedLocation, catalogStores: stores, homeSearchQuery, setHomeSearchQuery } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get('q') ?? homeSearchQuery ?? '');
  const inputRef = useRef(null);
  const [recentSearches, setRecentSearches] = useState(['Mango pickle']);
  const [sortBy, setSortBy] = useState('popularity');
  const [maxPrice, setMaxPrice] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [apiProducts, setApiProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (homeSearchQuery !== searchTerm) setHomeSearchQuery(searchTerm);
  }, [homeSearchQuery, searchTerm, setHomeSearchQuery]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      const timer = window.setTimeout(() => setApiProducts([]), 0);
      return () => window.clearTimeout(timer);
    }
    let ignore = false;
    const loadingTimer = window.setTimeout(() => {
      if (!ignore) {
        setSearchLoading(true);
        setSearchError('');
      }
    }, 0);
    const selectedCategory = catalogCategories.find((category) => (category.name || category.title) === categoryFilter);
    const params = {
      status: 'ACTIVE',
      search: searchTerm.trim(),
      q: searchTerm.trim(),
      categoryId: selectedCategory?.id,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    };
    getProducts(params)
      .then((payload) => {
        if (!ignore) setApiProducts(adaptProductList(payload || []));
      })
      .catch(() => {
        if (!ignore) { setApiProducts([]); setSearchError('Search service is unavailable. Showing matching catalog products.'); }
      })
      .finally(() => { if (!ignore) setSearchLoading(false); });
    return () => {
      ignore = true;
      window.clearTimeout(loadingTimer);
    };
  }, [searchTerm, categoryFilter, catalogCategories]);

  const reviews = collectionStore.list('reviews').filter((review) => review.status === 'Approved' && review.active !== false);
  const categories = catalogCategories.map((category) => category.name || category.title || category);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const matchesSearchTerm = (product) => [product.title,product.name,product.description,product.category,product.subcategory,product.ingredients,product.tags,product.store,product.storeName]
    .filter(Boolean).join(' ').toLowerCase().includes(normalizedSearchTerm);
  const apiProductIds = useMemo(() => new Set(apiProducts.filter(matchesSearchTerm).map((item) => String(item.productId || item.id || ''))), [apiProducts, normalizedSearchTerm]); // eslint-disable-line react-hooks/exhaustive-deps
  const allProducts = deliveryProducts(catalogProducts, catalogStoreProducts, stores, selectedLocation)
    .map((product) => ({
      ...product,
      title: product.title || product.name || 'Product',
      category: product.category || product.categoryName || 'General',
      price: Number(product.price ?? product.offerPrice ?? 0),
      basePrice: Number(product.basePrice ?? product.price ?? product.offerPrice ?? 0),
      description: product.description || '',
      id: product.id || product.productId || product.sku || product.title,
      image: product.image || product.images?.[0] || '',
    }));
  const searchableProducts = allProducts.map((product) => {
    const productReviews=reviews.filter((review) => review.productId === (product.id || product.sku || product.title) || review.product === product.title);
    const rating=productReviews.length ? productReviews.reduce((sum,review)=>sum+Number(review.rating || 0),0)/productReviews.length : 0;
    const store=stores.find((item)=>item.name===product.store||item.name===product.storeName||item.id===product.storeId);
    const summary=deliverySummary(store || product, formatCurrency);
    const pickup=product.pickup === true || product.pickup === 'Yes' || store?.pickup === 'Yes';
    const deliveryMinutes=Number(product.deliveryMinutes || product.deliveryEtaMinutes || store?.deliveryEtaMinutes || 0);
    return { ...product,storeId:store?.id || product.storeId,store:store?.name || product.store || product.storeName,deliverySummary:summary,rating,ratingCount:productReviews.length,pickup,deliveryMinutes,under30:deliveryMinutes>0&&deliveryMinutes<=30,offer:Number(product.discount || 0)>0 || (Number(product.offerPrice)>0&&Number(product.offerPrice)<product.basePrice),popularity:product.bestSeller==='Yes'?100:0,newest:new Date(product.createdAt || 0).getTime() };
  });
  const filteredProducts = (searchTerm.trim()
    ? searchableProducts.filter((p) => {
        const id = String(p.productId || p.id || '');
        const textMatch = matchesSearchTerm(p);
        return textMatch || apiProductIds.has(id);
      })
    : []).filter((product) => categoryFilter === 'all' || product.category === categoryFilter).filter((product) => maxPrice === 'all' || Number(product.price) <= Number(maxPrice)).filter((product) => ratingFilter === 'all' || (ratingFilter === '5' ? product.rating === 5 : product.rating >= 4)).filter((product) => availabilityFilter === 'all' || (availabilityFilter === 'pickup' ? product.pickup : product.under30)).sort((a,b) => sortBy === 'price-low' ? Number(a.price)-Number(b.price) : sortBy === 'price-high' ? Number(b.price)-Number(a.price) : sortBy === 'newest' ? b.newest-a.newest : sortBy === 'pickup' ? Number(b.pickup)-Number(a.pickup) || b.popularity-a.popularity : sortBy === 'offers' ? Number(b.offer)-Number(a.offer) || b.popularity-a.popularity : sortBy === 'under30' ? Number(b.under30)-Number(a.under30) || (a.deliveryMinutes || Infinity)-(b.deliveryMinutes || Infinity) : b.popularity-a.popularity);

  const hasActiveFilters = categoryFilter !== 'all' || maxPrice !== 'all' || ratingFilter !== 'all' || availabilityFilter !== 'all' || sortBy !== 'popularity';
  const clearFilters = () => {
    setCategoryFilter('all');
    setMaxPrice('all');
    setRatingFilter('all');
    setAvailabilityFilter('all');
    setSortBy('popularity');
  };

  const handleRecentClick = (term) => {
    setSearchTerm(term);
  };

  const rememberSearch = () => {
    const term = searchTerm.trim();
    if (term) setRecentSearches((items) => [term, ...items.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 5));
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleItemClick = (product) => {
    setSelectedProduct(product);
    const targetId = product.productId || product.id || product.sku || product.title;
    navigate(`/product-info/${encodeURIComponent(targetId)}`);
  };

  return (
    <Box className="search-page-wrapper">
      {/* Header bar matching screenshot */}
      {!searchTerm ? (
        <Box className="search-header-default">
          <IconButton onClick={() => navigate(-1)} style={{ color: '#1e293b' }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography className="search-header-title">Search</Typography>
        </Box>
      ) : null}

      {/* Search Input Box */}
      <Box className="search-box-wrap">
        <Box className="search-input-container">
          {searchTerm ? (
            <IconButton onClick={() => navigate(-1)} className="search-back-icon">
              <ArrowBackIcon style={{ color: '#64748b' }} />
            </IconButton>
          ) : null}

          <InputBase
            placeholder='Search for "Mango Pickle"'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') rememberSearch(); }}
            className="search-input-field"
            inputRef={inputRef}
            autoFocus
          />

          {searchTerm ? (
            <IconButton onClick={handleClearSearch} className="clear-icon">
              <CloseIcon style={{ color: '#64748b' }} />
            </IconButton>
          ) : (
            <SearchIcon className="search-magnify-icon" />
          )}
        </Box>
      </Box>

      {/* View 1: Default Search Screen (Recent Searches) */}
      {!searchTerm && (
        <Box className="recent-searches-view">
          <Typography className="recent-searches-heading">Recent Searches</Typography>

          <Box className="recent-pills-row">
            {recentSearches.map((term, idx) => (
              <Box key={idx} className="recent-pill" onClick={() => handleRecentClick(term)}>
                <AccessTimeIcon className="recent-clock-icon" fontSize="small" />
                <span>{term}</span>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* View 2: Search Results List (Matching search history screenshot) */}
      {searchTerm && (
        <Box className="search-results-scroll">
          <Box className="search-tools" aria-label="Search filters">
            <Select size="small" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
            </Select>
            <Select size="small" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
              <MenuItem value="all">All Prices</MenuItem>
              <MenuItem value="150">Under {formatCurrency(150)}</MenuItem>
              <MenuItem value="200">Under {formatCurrency(200)}</MenuItem>
              <MenuItem value="300">Under {formatCurrency(300)}</MenuItem>
            </Select>
            <Select size="small" value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
              <MenuItem value="all">All Ratings</MenuItem>
              <MenuItem value="4">4 stars & above</MenuItem>
              <MenuItem value="5">5 stars only</MenuItem>
            </Select>
            <Select size="small" value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
              <MenuItem value="all">All Availability</MenuItem>
              <MenuItem value="pickup">Pickup Available</MenuItem>
              <MenuItem value="under30">Under 30 min</MenuItem>
            </Select>
            <Select size="small" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <MenuItem value="popularity">Popularity</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="price-low">Price Low to High</MenuItem>
              <MenuItem value="price-high">Price High to Low</MenuItem>
              <MenuItem value="pickup">Pickup</MenuItem>
              <MenuItem value="offers">Offers</MenuItem>
              <MenuItem value="under30">Under 30 min delivery</MenuItem>
            </Select>
            {hasActiveFilters && <Button className="clear-filters-btn" onClick={clearFilters}>Clear filters</Button>}
          </Box>
          <Box className="search-results-summary">
            <Typography>{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found</Typography>
            <Typography>Sorted by {sortBy === 'price-low' ? 'Price: Low to High' : sortBy === 'price-high' ? 'Price: High to Low' : sortBy === 'under30' ? 'Under 30 min delivery' : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</Typography>
          </Box>
          {searchLoading && <Typography role="status" sx={{ px:1, color:'#64748b' }}>Searching products...</Typography>}
          {searchError && <Typography role="alert" sx={{ px:1, color:'#b45309' }}>{searchError}</Typography>}
          {filteredProducts.length === 0 ? (
            <Box className="no-results-box">
              <Typography variant="body1" color="textSecondary">
                No products match “{searchTerm}” with the selected filters.
              </Typography>
            </Box>
          ) : (
            filteredProducts.map((prod) => (
              <Box key={`${prod.storeId}:${prod.id}`} className="search-result-card" onClick={() => handleItemClick(prod)}>
                <Box className="search-card-left">
                  <Typography className="search-prod-title">{prod.title}</Typography>
                  <Typography className="search-prod-specs">
                    {prod.weight} | <span className="price-bold">{formatCurrency(prod.price)}</span>
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                    <Rating value={prod.rating} precision={0.1} size="small" readOnly />
                    <Typography variant="caption">
                      {prod.ratingCount ? `${prod.rating.toFixed(1)} (${prod.ratingCount})` : 'No ratings'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                    {prod.offer && <Chip size="small" label="Offer" color="success" variant="outlined" />}
                    {prod.pickup && <Chip size="small" label="Pickup" variant="outlined" />}
                    {prod.under30 && <Chip size="small" label="Under 30 min" variant="outlined" />}
                  </Box>
                  <Typography className="search-prod-delivery">
                    {[prod.store, prod.deliverySummary?.etaLabel, prod.deliverySummary?.chargeLabel].filter(Boolean).join(' | ') || 'Standard delivery'}
                  </Typography>
                </Box>

                <Box className="search-card-right">
                  <Box className="search-img-box">
                    <SafeProductImage src={prod.image} alt={prod.title} />
                  </Box>
                  <Button
                    variant="contained"
                    className="search-add-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      addToCart({
                        id: prod.id,
                        productId: prod.productId,
                        variantId: prod.variantId,
                        selectedVariant: prod.variants?.[0],
                        title: prod.title,
                        weight: prod.weight,
                        price: prod.price,
                        image: prod.image,
                        storeId: prod.storeId,
                        store: prod.store,
                      });
                    }}
                    disabled={prod.active === false}
                  >
                    {prod.active === false ? 'Unavailable' : 'Add +'}
                  </Button>
                </Box>
              </Box>
            ))
          )}
        </Box>
      )}
    </Box>
  );
};

export default SearchPage;
