/**
 * ProductCard.jsx — Lens Popular Product Card
 * =============================================
 * Displays a single product in the Lens horizontal scroll carousel.
 * Extracted from LensOverlay inline JSX. Shows product image with
 * brand name + product name overlay at the bottom.
 */

import React from 'react';

const vibrate = (ms) => { if (navigator.vibrate) navigator.vibrate(ms); };

const ProductCard = ({ product, onClick }) => (
  <div
    className="flex-shrink-0 w-32 group cursor-pointer snap-start active:scale-95 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_20px_rgba(255,255,255,0.08)]"
    onClick={() => { vibrate(5); onClick?.(); }}
  >
    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#0B1221] border border-white/5 group-hover:border-white/20 transition-colors duration-300">
      <img
        src={product.image}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
        alt={product.name}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
      <div className="absolute bottom-2 left-2 right-2">
        <p className="text-[9px] text-neon font-bold uppercase mb-0.5 tracking-wider truncate">{product.brand}</p>
        <h4 className="text-xs font-bold text-white leading-tight truncate">{product.name}</h4>
      </div>
    </div>
  </div>
);

export default ProductCard;