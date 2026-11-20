import React, { useState } from 'react';
import {
  Cable,
  CircleDot,
  Cylinder,
  Droplets,
  Flame,
  Gauge,
  Hammer,
  Lightbulb,
  Package,
  Wrench,
} from 'lucide-react';

export function getProductIconInfo(product = {}) {
  const name = (product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();

  if (category.includes('ilumin') || name.includes('bombillo') || name.includes('foco') || name.includes('led')) {
    return { bg: 'bg-amber-50', color: 'text-amber-600', Icon: Lightbulb };
  }
  if (category.includes('electr') || name.includes('cable') || name.includes('thw') || name.includes('alambre')) {
    return { bg: 'bg-teal-50', color: 'text-[#074E4A]', Icon: Cable };
  }
  if (name.includes('tefl') || name.includes('cinta')) {
    return { bg: 'bg-sky-50', color: 'text-sky-600', Icon: CircleDot };
  }
  if (category.includes('fijaci') || category.includes('tornill') || name.includes('clavo') || name.includes('tornillo')) {
    return { bg: 'bg-slate-100', color: 'text-slate-700', Icon: Hammer };
  }
  if (category.includes('caucho') || name.includes('caucho') || name.includes('empacadura') || name.includes('goma')) {
    return { bg: 'bg-zinc-100', color: 'text-zinc-700', Icon: CircleDot };
  }
  if (name.includes('disco') || name.includes('corte') || name.includes('esmeril')) {
    return { bg: 'bg-orange-50', color: 'text-orange-600', Icon: Gauge };
  }
  if (category.includes('herrer') || category.includes('soldad') || name.includes('electrodo') || name.includes('soldar')) {
    return { bg: 'bg-rose-50', color: 'text-rose-600', Icon: Flame };
  }
  if (name.includes('llave de paso') || name.includes('valvula') || name.includes('esfera')) {
    return { bg: 'bg-yellow-50', color: 'text-yellow-700', Icon: Gauge };
  }
  if (category.includes('herramient') || name.includes('llave') || name.includes('alicate') || name.includes('martillo')) {
    return { bg: 'bg-emerald-50', color: 'text-[#074E4A]', Icon: Wrench };
  }
  if (category.includes('construc') || name.includes('manguera') || name.includes('nivel')) {
    return { bg: 'bg-cyan-50', color: 'text-cyan-700', Icon: Droplets };
  }
  if (name.includes('tubo') || name.includes('pvc') || name.includes('tuberia')) {
    return { bg: 'bg-stone-100', color: 'text-stone-700', Icon: Cylinder };
  }
  if (category.includes('adhesiv') || category.includes('quimic') || name.includes('pega') || name.includes('silicon')) {
    return { bg: 'bg-indigo-50', color: 'text-indigo-600', Icon: Package };
  }

  return { bg: 'bg-[#F2F7F6]', color: 'text-[#074E4A]', Icon: Package };
}

export default function ProductThumbnail({
  product = {},
  size = 'sm',
  preferIcon = true
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const { bg, color, Icon } = getProductIconInfo(product);
  const dims = size === 'sm' ? 'w-10 h-10 rounded-xl' : 'w-12 h-12 rounded-2xl';
  const iconDims = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  // If user does not prefer icon and has image
  if (!preferIcon && product.image_url && product.image_url.trim() && !imgFailed) {
    return (
      <img
        src={product.image_url}
        alt={product.name || 'Producto'}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${dims} object-cover shrink-0 border border-black/[0.06] bg-white`}
      />
    );
  }

  return (
    <div
      className={`${dims} ${bg} ${color} flex items-center justify-center shrink-0 border border-black/[0.04] shadow-2xs`}
      aria-label={product.name || 'Producto'}
    >
      <Icon className={iconDims} />
    </div>
  );
}
