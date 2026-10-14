import { useContext, useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, LinearProgress, MenuItem, Rating, Select, TextField, Typography } from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { useNavigate } from 'react-router-dom';
import { collectionStore, loyaltyStore, notificationStore, subscribeToLocalData } from '../../services/localDataService';
import { AppContext } from '../../context/AppContext';
import { getCustomerOrderHistory, isOrderServiceUnavailable, normalizeOrder, ORDER_STATUSES } from '../../services/orderApi';
import FulfillmentTrackingPanel from '../../components/FulfillmentTrackingPanel/FulfillmentTrackingPanel';
import { useFulfillmentTracking } from '../../hooks/useFulfillmentTracking';

const content = {
  notifications: { title: 'Notifications', empty: 'You have no notifications yet.' },
  reviews: { title: 'Ratings & Reviews', empty: 'No reviews have been submitted yet.' },
  loyalty: { title: 'Rewards & Offers', empty: 'Rewards, referrals and gift vouchers will appear here.' },
  localization: { title: 'Language & Currency', empty: 'Choose how content and prices are displayed.' },
  tracking: { title: 'Order Tracking', empty: 'Live tracking becomes available after an order is assigned for delivery.' },
  about: { title: 'About Us', empty: 'Authentic pickles, spices and traditional flavours prepared with care.' },
  contact: { title: 'Contact Us', empty: 'Call, email or use the Help Center to contact our support team.' },
};

const CustomerFeaturePage = ({ type }) => {
  const navigate = useNavigate();
  const { locale, updateLocale, selectedProduct, user, isLoggedIn, formatDateTime } = useContext(AppContext);
  const config = content[type] || content.notifications;
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [language, setLanguage] = useState(locale.language);
  const [currency, setCurrency] = useState(locale.currency);
  const [timeZone, setTimeZone] = useState(locale.timeZone);
  const [notifications, setNotifications] = useState(() => notificationStore.list());
  const [loyalty, setLoyalty] = useState(() => loyaltyStore.get());
  const [reviews, setReviews] = useState(() => collectionStore.list('reviews'));
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewImage, setReviewImage] = useState('');
  const [trackingOrders, setTrackingOrders] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  useEffect(() => subscribeToLocalData(({ key }) => {
    if (!key || key === 'notifications') setNotifications(notificationStore.list());
  }), []);
  useEffect(() => {
    if (type !== 'tracking' || !user?.id) return undefined;
    let ignore = false;
    const timer = window.setTimeout(() => {
      if (!ignore) {
        setTrackingLoading(true);
        setTrackingError('');
      }
    }, 0);
    Promise.resolve().then(() => getCustomerOrderHistory(user.id))
      .then((payload) => {
        if (!ignore) {
          const rows = Array.isArray(payload) ? payload : payload?.orders || payload?.content || [];
          setTrackingOrders(rows.map(normalizeOrder));
        }
      })
      .catch((error) => {
        if (!ignore) {
          setTrackingOrders([]);
          setTrackingError(isOrderServiceUnavailable(error) ? 'Order Service is unavailable.' : error.message);
        }
      })
      .finally(() => {
        if (!ignore) setTrackingLoading(false);
      });
    return () => { ignore = true; window.clearTimeout(timer); };
  }, [type, user?.id]);
  const canReview = useMemo(() => rating > 0 && text.trim().length >= 5, [rating, text]);
  const productKey = selectedProduct?.id || selectedProduct?.sku || selectedProduct?.title || '';
  const trackedOrder = trackingOrders[0] || null;
  const fulfillmentTracking = useFulfillmentTracking(type === 'tracking' ? trackedOrder?.id : '');
  const productReviews = useMemo(() => reviews.filter((review) => !productKey || !review.productId || review.productId === productKey), [reviews, productKey]);
  const approvedReviews = useMemo(() => productReviews.filter((review) => review.status === 'Approved' && review.active !== false), [productReviews]);
  const averageRating = approvedReviews.length ? approvedReviews.reduce((sum,review) => sum + Number(review.rating || 0),0) / approvedReviews.length : 0;

  const handleReviewImages = (files) => {
    const selected = [...files].slice(0,4);
    if (selected.some((file) => !file.type.startsWith('image/') || file.size > 2*1024*1024)) return setMessage('Use up to 4 JPG, PNG or WebP images under 2 MB each.');
    Promise.all(selected.map((file) => new Promise((resolve,reject) => { const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file); }))).then(setReviewImages).catch(() => setMessage('One or more images could not be read.'));
  };
  const submitReview = () => {
    if (!isLoggedIn) return navigate('/login', { state: { from:'/reviews' } });
    if (!canReview) { setMessage('Select a rating and enter at least 5 characters.'); return; }
    collectionStore.add('reviews', { name:user?.name || 'Customer',customerId:user?.id,productId:productKey,product:selectedProduct?.title || 'Product',rating,text:text.trim(),images:reviewImages,image:reviewImages[0] || '',helpful:0,helpfulBy:[],status:'Pending',active:true,createdAt:new Date().toISOString() });
    setReviews(collectionStore.list('reviews'));setMessage('Review submitted for approval.');setRating(0);setText('');setReviewImages([]);
  };
  const voteHelpful = (review) => {
    if (!isLoggedIn) return navigate('/login', { state: { from:'/reviews' } });
    const voters=review.helpfulBy || [];
    if (voters.includes(user.id)) return;
    collectionStore.update('reviews',review.id,{helpful:Number(review.helpful || 0)+1,helpfulBy:[...voters,user.id]});
    setReviews(collectionStore.list('reviews'));
  };

  const saveLocale = () => {
    updateLocale({ language, currency, timeZone });
    setMessage('Language, currency and timezone preferences saved.');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Box sx={{ bgcolor: '#075F40', color: 'white', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button onClick={() => navigate(-1)} sx={{ color: 'white' }}>Back</Button>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{config.title}</Typography>
      </Box>
      <Box sx={{ maxWidth: 760, mx: 'auto', p: 3 }}>
        <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 3, boxShadow: '0 4px 16px rgba(15,23,42,.08)' }}>
          <Typography sx={{ color: '#64748b', mb: 2 }}>{config.empty}</Typography>

          {type === 'notifications' && <Box>{notifications.length === 0 ? <Typography>No notifications.</Typography> : notifications.map((item) => <Box key={item.id} onClick={() => { notificationStore.markRead(item.id); setNotifications(notificationStore.list()); }} sx={{ p:2,mb:1,border:'1px solid #e2e8f0',borderRadius:2,cursor:'pointer',bgcolor:item.read ? '#fff' : '#ecfdf5' }}><Typography fontWeight={700}>{item.title}</Typography><Typography>{item.message}</Typography><Typography variant="caption">{new Date(item.createdAt).toLocaleString()}</Typography></Box>)}{notifications.length > 0 && <Button color="error" onClick={() => { notificationStore.clear(); setNotifications([]); }}>Clear All</Button>}</Box>}

          {type === 'legacy-reviews' && <Box sx={{ display: 'grid', gap: 2 }}>
            <Rating value={rating} onChange={(_, value) => setRating(value || 0)} aria-label="Product rating" />
            <TextField label="Write your review" multiline minRows={4} value={text} onChange={(e) => setText(e.target.value)} />
            <Button component="label" variant="outlined">Add Review Image<input hidden type="file" accept="image/*" onChange={(e) => { const file=e.target.files?.[0]; if(file){ const reader=new FileReader(); reader.onload=()=>setReviewImage(reader.result); reader.readAsDataURL(file); } }} /></Button>
            {reviewImage && <img src={reviewImage} alt="Review preview" style={{ width:100,height:100,objectFit:'cover',borderRadius:8 }} />}
            <Button variant="contained" disabled={!canReview} onClick={() => { const next=[{ id:crypto.randomUUID(),name:'Customer Review',rating,text,image:reviewImage,helpful:0,status:'Pending',active:true },...reviews]; localStorage.setItem('local:reviews',JSON.stringify(next)); setReviews(next); setMessage('Review saved locally for approval.'); setRating(0); setText(''); setReviewImage(''); }}>Submit Review</Button>
            <Typography variant="h6">Customer Reviews {reviews.length > 0 && `· ${(reviews.reduce((sum,item)=>sum+item.rating,0)/reviews.length).toFixed(1)} average`}</Typography>
            {reviews.filter((review) => review.status === 'Approved').map((review) => <Box key={review.id} sx={{ border:'1px solid #e2e8f0',p:2,borderRadius:2 }}><Rating readOnly value={review.rating} />{review.image && <img src={review.image} alt="Customer review" style={{ width:80,height:80,objectFit:'cover',display:'block' }} />}<Typography>{review.text}</Typography>{review.reply && <Typography color="text.secondary">Store reply: {review.reply}</Typography>}<Button onClick={() => { const next=reviews.map((item)=>item.id===review.id?{...item,helpful:item.helpful+1}:item);localStorage.setItem('local:reviews',JSON.stringify(next));setReviews(next); }}>Helpful ({review.helpful})</Button></Box>)}
          </Box>}

          {type === 'reviews' && <Box sx={{ display:'grid',gap:3 }}>
            <Box sx={{ display:'grid',gridTemplateColumns:{xs:'1fr',sm:'180px 1fr'},gap:3,p:2,border:'1px solid #e2e8f0',borderRadius:2 }}>
              <Box sx={{ textAlign:'center' }}><Typography sx={{ fontSize:42,fontWeight:800 }}>{averageRating.toFixed(1)}</Typography><Rating readOnly precision={0.1} value={averageRating} /><Typography color="text.secondary">{approvedReviews.length} approved {approvedReviews.length === 1 ? 'review' : 'reviews'}</Typography></Box>
              <Box sx={{ display:'grid',gap:.5 }}>{[5,4,3,2,1].map((star) => { const count=approvedReviews.filter((review)=>Number(review.rating)===star).length;return <Box key={star} sx={{ display:'grid',gridTemplateColumns:'28px 1fr 24px',alignItems:'center',gap:1 }}><Typography>{star}★</Typography><LinearProgress variant="determinate" value={approvedReviews.length ? count/approvedReviews.length*100 : 0} sx={{ height:7,borderRadius:1,'& .MuiLinearProgress-bar':{bgcolor:'#f4b400'} }} /><Typography color="text.secondary">{count}</Typography></Box>; })}</Box>
            </Box>
            <Box sx={{ display:'grid',gap:2,p:2,border:'1px solid #e2e8f0',borderRadius:2 }}><Typography variant="h6" fontWeight={700}>Review {selectedProduct?.title || 'this product'}</Typography><Rating value={rating} onChange={(_,value)=>{setRating(value || 0);setMessage('');}} aria-label="Product rating from 1 to 5" /><TextField label="Write your review" placeholder="Share details about quality, taste and packaging" multiline minRows={4} value={text} onChange={(event)=>{setText(event.target.value);setMessage('');}} inputProps={{ maxLength:1000 }} helperText={`${text.length}/1000`} /><Button component="label" variant="outlined" startIcon={<PhotoCameraOutlinedIcon />}>Add review images<input hidden multiple type="file" accept="image/png,image/jpeg,image/webp" onChange={(event)=>handleReviewImages(event.target.files)} /></Button>{reviewImages.length > 0 && <Box sx={{ display:'flex',gap:1,flexWrap:'wrap' }}>{reviewImages.map((image,index)=><Box key={image} sx={{ position:'relative' }}><img src={image} alt={`Review preview ${index+1}`} style={{ width:88,height:88,objectFit:'cover',borderRadius:6 }} /><Button size="small" color="error" onClick={()=>setReviewImages((items)=>items.filter((_,itemIndex)=>itemIndex!==index))}>Remove</Button></Box>)}</Box>}<Button fullWidth variant="contained" onClick={submitReview}>{isLoggedIn ? 'Submit Review' : 'Login to review'}</Button></Box>
            <Box><Typography variant="h6" fontWeight={700} mb={1}>Customer Reviews</Typography>{approvedReviews.length === 0 ? <Typography color="text.secondary">No approved reviews yet.</Typography> : approvedReviews.map((review) => { const images=review.images?.length ? review.images : review.image ? [review.image] : [];const voted=(review.helpfulBy || []).includes(user?.id);return <Box key={review.id} sx={{ borderTop:'1px solid #e2e8f0',py:2,display:'grid',gap:1 }}><Box sx={{ display:'flex',justifyContent:'space-between',gap:2 }}><Box><Typography fontWeight={700}>{review.name || 'Customer'} <VerifiedOutlinedIcon sx={{ fontSize:15,color:'#087451',verticalAlign:'middle' }} /></Typography><Rating readOnly size="small" value={Number(review.rating)} /></Box>{review.createdAt && <Typography variant="caption" color="text.secondary">{formatDateTime(review.createdAt,{dateStyle:'medium'})}</Typography>}</Box><Typography>{review.text}</Typography>{images.length > 0 && <Box sx={{ display:'flex',gap:1,flexWrap:'wrap' }}>{images.map((image,index)=><img key={image} src={image} alt={`Customer review ${index+1}`} style={{ width:92,height:92,objectFit:'cover',borderRadius:6 }} />)}</Box>}{review.reply && <Box sx={{ bgcolor:'#f5f8f6',p:1.5,borderLeft:'3px solid #075F40' }}><Typography fontWeight={700}>Response from store</Typography><Typography>{review.reply}</Typography></Box>}<Button size="small" startIcon={<ThumbUpOutlinedIcon />} disabled={voted} onClick={()=>voteHelpful(review)} sx={{ justifySelf:'start',textTransform:'none' }}>{voted ? 'Marked helpful' : 'Helpful'} ({Number(review.helpful || 0)})</Button></Box>; })}</Box>
          </Box>}

          {type === 'localization' && <Box sx={{ display: 'grid', gap: 2 }}>
            <Select value={language} onChange={(e) => setLanguage(e.target.value)} inputProps={{ 'aria-label': 'Language' }}>
              {['English', 'Hindi', 'Telugu'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </Select>
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)} inputProps={{ 'aria-label': 'Currency' }}>
              {['INR', 'USD'].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </Select>
            <Select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} inputProps={{ 'aria-label':'Time zone' }}><MenuItem value="Asia/Kolkata">Asia/Kolkata</MenuItem><MenuItem value="UTC">UTC</MenuItem><MenuItem value="America/New_York">America/New_York</MenuItem><MenuItem value="Europe/London">Europe/London</MenuItem><MenuItem value="Asia/Dubai">Asia/Dubai</MenuItem></Select>
            <Button variant="contained" onClick={saveLocale}>Save Preferences</Button>
            <Typography>Application version: 1.0.0</Typography>
            <Button variant="outlined" onClick={() => window.location.reload()}>Check for Updates</Button>
          </Box>}

          {type === 'tracking' && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {ORDER_STATUSES.map((item) => { const current=trackedOrder;return <Chip key={item} label={item} color={current && ORDER_STATUSES.indexOf(item)<=ORDER_STATUSES.indexOf(current.status) ? 'success' : 'default'} />; })}
          </Box>}

          {type === 'tracking' && <Box sx={{ mt:2, display: 'grid', gap: 2 }}>{trackingLoading ? <Typography role="status">Loading orders...</Typography> : trackingError ? <Typography role="alert" color="error">{trackingError}</Typography> : !trackedOrder ? <Typography>No orders to track.</Typography> : <><Box><Typography fontWeight={700}>{trackedOrder.id}</Typography><Typography>Status: {trackedOrder.status}</Typography><Button onClick={() => navigate(`/order-details/${encodeURIComponent(trackedOrder.id)}`, { state: { orderId: trackedOrder.id } })}>View Details</Button></Box><FulfillmentTrackingPanel order={trackedOrder} {...fulfillmentTracking} /></>}</Box>}

          {type === 'loyalty' && <Box sx={{ display:'grid',gap:2 }}><Typography variant="h5">{loyalty.points} points</Typography><Typography>Referral code: <strong>{loyalty.referralCode}</strong></Typography><Button variant="contained" onClick={() => { try { setLoyalty(loyaltyStore.redeem(100)); setMessage('₹10 gift voucher created.'); } catch (error) { setMessage(error.message); } }}>Redeem 100 Points</Button>{loyalty.vouchers.map((voucher) => <Chip key={voucher.id} label={`${voucher.code} — ₹${voucher.value}`} />)}</Box>}

          {message && <Typography role="status" sx={{ color: '#075F40', mt: 2 }}>{message}</Typography>}
        </Box>
      </Box>
    </Box>
  );
};

export default CustomerFeaturePage;
