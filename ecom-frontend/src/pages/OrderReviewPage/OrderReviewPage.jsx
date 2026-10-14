import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, Rating, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import AddAPhotoOutlinedIcon from '@mui/icons-material/AddAPhotoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import { getOrder, getOrderReview, normalizeOrder, saveOrderReview } from '../../services/orderApi';
import { getFulfillmentByOrderId, getShipmentByOrderId, normalizeFulfillment, normalizeShipment } from '../../services/fulfillmentApi';

const MAX_PHOTOS = 3;
const MAX_FILE_BYTES = 120 * 1024;

const readPhoto = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('The photo could not be read.'));
  reader.readAsDataURL(file);
});

export default function OrderReviewPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [deliveryComplete, setDeliveryComplete] = useState(false);

  useEffect(() => {
    let active = true;
    const optional = (request) => request.catch((requestError) => requestError?.status === 404 ? null : null);
    Promise.all([getOrder(orderId), optional(getOrderReview(orderId)), optional(getFulfillmentByOrderId(orderId)), optional(getShipmentByOrderId(orderId))])
      .then(([savedOrder, review, savedFulfillment, savedShipment]) => {
        if (!active) return;
        const fulfillment = normalizeFulfillment(savedFulfillment || {});
        const shipment = normalizeShipment(savedShipment || {});
        const complete = ['DELIVERED', 'Delivered'].includes(fulfillment.status) || ['DELIVERED', 'Delivered'].includes(shipment.status);
        setDeliveryComplete(complete);
        setOrder({ ...normalizeOrder(savedOrder), status: complete ? 'DELIVERED' : normalizeOrder(savedOrder).status });
        if (review) {
          setRating(Number(review.rating) || 0);
          setComment(review.comment || '');
          setPhotos(Array.isArray(review.photoUrls) ? review.photoUrls : []);
          setSubmitted(true);
        }
      })
      .catch((requestError) => active && setError(requestError.message || 'Unable to load this order.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [orderId]);

  const addPhotos = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (photos.length + files.length > MAX_PHOTOS) return setError(`You can add up to ${MAX_PHOTOS} photos.`);
    const invalid = files.find((file) => !file.type.startsWith('image/') || file.size > MAX_FILE_BYTES);
    if (invalid) return setError('Choose image files smaller than 120 KB.');
    try {
      setError('');
      const nextPhotos = await Promise.all(files.map(readPhoto));
      setPhotos((current) => [...current, ...nextPhotos]);
    } catch (photoError) { setError(photoError.message); }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!rating) return setError('Please select a star rating.');
    setSaving(true); setError('');
    try {
      await saveOrderReview(orderId, { rating, comment: comment.trim(), photoUrls: photos });
      setSubmitted(true);
    } catch (requestError) { setError(requestError.message || 'Your review could not be saved.'); }
    finally { setSaving(false); }
  };

  const page = (content) => <Box sx={{ minHeight: '100vh', bgcolor: '#f6f8f7', pb: 10 }}><Header /><Box sx={{ maxWidth: 620, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>{content}</Box><BottomNav /></Box>;
  if (loading) return page(<Box sx={{ textAlign: 'center', pt: 8 }}><CircularProgress /><Typography sx={{ mt: 2 }}>Loading order...</Typography></Box>);
  if (error && !order) return page(<><Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')}>Orders</Button><Alert severity="error" sx={{ mt: 2 }}>{error}</Alert></>);
  if (order?.status !== 'DELIVERED' && !deliveryComplete) return page(<><Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/order-details/${orderId}`)}>Back to order</Button><Box sx={{ mt: 5, textAlign: 'center' }}><Typography variant="h5" fontWeight={700}>Review available after delivery</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>You can rate this order when its delivery is complete.</Typography></Box></>);
  if (submitted) return page(<><Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/order-details/${orderId}`)}>Back to order</Button><Box sx={{ bgcolor: '#fff', mt: 3, p: { xs: 3, sm: 5 }, textAlign: 'center', border: '1px solid #dde6e1', borderRadius: 2 }}><CheckCircleOutlineIcon sx={{ fontSize: 54, color: '#087f5b' }} /><Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>Thanks for sharing</Typography><Typography color="text.secondary" sx={{ mt: 1.5 }}>Your review for {order.items?.[0]?.title || 'this order'} has been saved.</Typography><Rating value={rating} readOnly sx={{ mt: 2 }} /><Box sx={{ mt: 3 }}><Button variant="contained" onClick={() => setSubmitted(false)}>Edit review</Button><Button sx={{ ml: 1 }} onClick={() => navigate('/orders')}>View orders</Button></Box></Box></>);

  return page(<><Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/order-details/${orderId}`)}>Back to order</Button><Box component="form" onSubmit={submit} sx={{ mt: 2, bgcolor: '#fff', border: '1px solid #dde6e1', borderRadius: 2, overflow: 'hidden' }}><Box sx={{ p: { xs: 2.5, sm: 4 }, textAlign: 'center' }}><Typography variant="h5" fontWeight={800}>Rate this order</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{order.items?.[0]?.title || 'Your delivered order'}</Typography><Rating name="order-rating" value={rating} onChange={(_, value) => { setRating(value || 0); setError(''); }} size="large" sx={{ mt: 2 }} /><Typography variant="body2" color="text.secondary">{rating ? `${rating} out of 5` : 'Tap a star to rate'}</Typography></Box><Box sx={{ borderTop: '1px solid #e5e7eb', p: { xs: 2.5, sm: 4 } }}><TextField fullWidth multiline minRows={4} label="Tell us about your experience" value={comment} inputProps={{ maxLength: 1000 }} onChange={(event) => setComment(event.target.value)} helperText={`${comment.length}/1000`} /><Box sx={{ mt: 2 }}><Button component="label" variant="outlined" startIcon={<AddAPhotoOutlinedIcon />} disabled={photos.length >= MAX_PHOTOS}>Add photos ({photos.length}/{MAX_PHOTOS})<input hidden type="file" accept="image/*" multiple onChange={addPhotos} /></Button><Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>{photos.map((photo, index) => <Box key={photo.slice(-24) + index} sx={{ position: 'relative' }}><Box component="img" src={photo} alt={`Review attachment ${index + 1}`} sx={{ width: 82, height: 82, objectFit: 'cover', borderRadius: 1, border: '1px solid #cbd5e1' }} /><IconButton size="small" aria-label={`Remove photo ${index + 1}`} onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))} sx={{ position: 'absolute', top: -10, right: -10, bgcolor: '#fff', border: '1px solid #cbd5e1' }}><CloseIcon fontSize="small" /></IconButton></Box>)}</Box></Box>{error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}<Button type="submit" variant="contained" fullWidth disabled={saving} sx={{ mt: 3, py: 1.35 }}>{saving ? 'Saving review...' : 'Submit review'}</Button></Box></Box></>);
}
