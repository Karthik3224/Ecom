import traditionalPicklesImage from '../assets/images/traditional_pickles.png';
import premiumDryFruitsImage from '../assets/images/dry_fruits.png';
import freshVegetablesImage from '../assets/images/shop_categories.png';
import freshNonVegImage from '../assets/images/best_sellers.png';
import mangoPickleImage from '../assets/images/mango_pickle_jar.png';
import garlicPickleImage from '../assets/images/garlic_pickle_jar.png';
import lemonPickleImage from '../assets/images/lemon_pickle_jar.png';
import homeSpicesImage from '../assets/images/home_spices.png';

const CATEGORY_IMAGES = {
  'traditional-pickles': traditionalPicklesImage,
  'premium-dry-fruits': premiumDryFruitsImage,
  'fresh-vegetables': freshVegetablesImage,
  'fresh-non-veg': freshNonVegImage,
};

const categoryKey = (category = {}) => String(category.slug || category.name || category.title || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export const categoryImageFor = (category) => CATEGORY_IMAGES[categoryKey(category)] || '';

export const productImageFor = (product = {}) => {
  const text = `${product.name || product.title || ''} ${product.categoryName || product.category || ''} ${product.type || ''}`.toLowerCase();
  if (text.includes('garlic')) return garlicPickleImage;
  if (text.includes('lemon') || text.includes('lime')) return lemonPickleImage;
  if (text.includes('pickle') || text.includes('avakaya') || text.includes('gongura') || text.includes('chilli')) return mangoPickleImage;
  if (text.includes('dry fruit') || text.includes('almond') || text.includes('cashew') || text.includes('walnut') || text.includes('raisin') || text.includes('pistachio')) return premiumDryFruitsImage;
  if (text.includes('vegetable') || text.includes('tomato') || text.includes('carrot') || text.includes('beans')) return freshVegetablesImage;
  if (text.includes('non-veg') || text.includes('chicken') || text.includes('mutton') || text.includes('prawn')) return freshNonVegImage;
  if (text.includes('spice')) return homeSpicesImage;
  return mangoPickleImage;
};

export const bannerImageFor = (banner = {}) => {
  const text = `${banner.title || banner.name || ''} ${banner.description || ''}`.toLowerCase();
  if (text.includes('dry fruit') || text.includes('nut')) return premiumDryFruitsImage;
  if (text.includes('vegetable') || text.includes('fresh')) return freshVegetablesImage;
  if (text.includes('non-veg') || text.includes('chicken')) return freshNonVegImage;
  if (text.includes('spice') || text.includes('delivery')) return homeSpicesImage;
  return traditionalPicklesImage;
};

export const homepageCategoryImages = Object.values(CATEGORY_IMAGES);
