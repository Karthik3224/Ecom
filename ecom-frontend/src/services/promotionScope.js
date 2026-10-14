import { collectionStore } from './localDataService';

export const resolvedPromotionScope=(promotion)=>{
  const creator=collectionStore.list('users').find((item)=>item.id===promotion.assignedBy);
  if(creator?.role==='global-admin') return {...promotion,scope:'Global',location:'',store:''};
  if(creator?.role==='location-admin') return {...promotion,scope:promotion.store?'Store':'Location',location:creator.location,store:promotion.store||''};
  return {...promotion,scope:promotion.scope||(promotion.store?'Store':promotion.location?'Location':'Global')};
};

export const promotionApplies=(promotion,{location='',store=''})=>{
  const item=resolvedPromotionScope(promotion);
  if(item.scope==='Global') return true;
  if(item.scope==='Location') return Boolean(location)&&item.location===location;
  return Boolean(store)&&item.store===store;
};
