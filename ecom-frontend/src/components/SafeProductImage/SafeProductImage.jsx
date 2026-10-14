import { useState } from 'react';
import fallbackProductImage from '../../assets/images/mango_pickle_jar.png';

const SafeProductImage = ({ src, alt, fallback = fallbackProductImage, ...props }) => {
  const [failedSrc, setFailedSrc] = useState('');
  const imageSrc = !src || failedSrc === src ? fallback : src;
  return <img {...props} src={imageSrc} alt={alt} onError={() => setFailedSrc(src || '')} />;
};

export default SafeProductImage;
