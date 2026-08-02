'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

const categories = [
  { name: 'New Collection', image: '/local-products/033-blush-pink-drape-1.jpg', href: '/collections?collection=new-collection' },
  { name: 'Heavy Dresses', image: '/images/categories/heavy-dresses.png', href: '/collections?collection=heavy-dresses' },
  { name: 'Co-ords', image: '/images/categories/co-ords.png', href: '/collections?collection=co-ords' },
  { name: 'Unstitched Suits', image: '/images/categories/unstitched.png', href: '/collections?collection=suits' },
  { name: 'Jewellery', image: '/images/categories/jewellery.png', href: '/collections?collection=jewellery' },
  { name: 'Flash Sale', image: '/local-products/001-bespoke-necklace-4-1.jpg', href: '/collections?collection=flash-sale' },
];

export default function ShopByCategories() {
  const trackRef = useRef(null);

  const move = (direction) => {
    trackRef.current?.scrollBy({
      left: direction * trackRef.current.clientWidth,
      behavior: 'smooth',
    });
  };

  return (
    <section className="shop-categories" aria-labelledby="shop-categories-title">
      <div className="container">
        <div className="shop-categories__header">
          <p className="shop-categories__eyebrow">Curated for every occasion</p>
          <h2 id="shop-categories-title">Shop by Categories</h2>
          <p>Discover silhouettes, fabrics and finishing touches made for your personal style.</p>
        </div>

        <div className="shop-categories__carousel">
          <button type="button" onClick={() => move(-1)} className="shop-categories__arrow shop-categories__arrow--left" aria-label="Previous categories">&#8249;</button>
          <div ref={trackRef} className="shop-categories__track">
            {categories.map((category, index) => (
              <Link href={category.href} className="shop-categories__card" key={category.name}>
                <span className="shop-categories__image">
                  <Image
                    src={category.image}
                    alt={`${category.name} collection`}
                    fill
                    priority={index < 2}
                    sizes="(max-width: 767px) 42vw, 280px"
                  />
                </span>
                <span className="shop-categories__name">{category.name}</span>
                <span className="shop-categories__link">Explore collection <span aria-hidden="true">&rarr;</span></span>
              </Link>
            ))}
          </div>
          <button type="button" onClick={() => move(1)} className="shop-categories__arrow shop-categories__arrow--right" aria-label="Next categories">&#8250;</button>
        </div>

        <div className="shop-categories__hint" aria-hidden="true"><span /> Swipe to discover <span /></div>
      </div>

      <style jsx>{`
        .shop-categories { padding: 3.25rem 0 3.5rem; overflow: hidden; background: linear-gradient(180deg, #fff 0%, #fdf6f7 100%); }
        .shop-categories__header { max-width: 620px; margin: 0 auto 2rem; padding: 0 1rem; text-align: center; }
        .shop-categories__eyebrow { margin: 0 0 .55rem; color: #a66c7b; font-size: .68rem; font-weight: 700; letter-spacing: .17em; text-transform: uppercase; }
        .shop-categories__header h2 { margin: 0; color: #222; font-family: var(--font-serif); font-size: clamp(2rem, 6vw, 3rem); font-weight: 400; line-height: 1.1; }
        .shop-categories__header > p:last-child { margin: .8rem auto 0; color: rgba(0,0,0,.58); font-size: .88rem; line-height: 1.6; }
        .shop-categories__carousel { position: relative; max-width: 700px; margin: 0 auto; }
        .shop-categories__track { display: grid; grid-auto-flow: column; grid-auto-columns: calc(50% - .45rem); gap: .9rem; overflow-x: auto; padding: .5rem .9rem 1rem; scroll-behavior: smooth; scroll-snap-type: x mandatory; scrollbar-width: none; }
        .shop-categories__track::-webkit-scrollbar { display: none; }
        .shop-categories__card { min-width: 0; color: inherit; text-align: center; text-decoration: none; scroll-snap-align: start; }
        .shop-categories__image { position: relative; display: block; width: 100%; aspect-ratio: 1; overflow: hidden; border: 3px solid #fff; border-radius: 50%; background: #f4e1e5; box-shadow: 0 12px 30px rgba(118,65,79,.16); transition: transform .3s ease, box-shadow .3s ease; }
        .shop-categories__image :global(img) { object-fit: cover; transition: transform .5s ease; }
        .shop-categories__card:hover .shop-categories__image { transform: translateY(-4px); box-shadow: 0 16px 34px rgba(118,65,79,.22); }
        .shop-categories__card:hover .shop-categories__image :global(img) { transform: scale(1.04); }
        .shop-categories__name { display: block; margin-top: 1rem; color: #282226; font-family: var(--font-serif); font-size: clamp(1rem, 4vw, 1.35rem); line-height: 1.15; }
        .shop-categories__link { display: block; margin-top: .4rem; color: #a66c7b; font-size: .61rem; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
        .shop-categories__arrow { position: absolute; top: 42%; z-index: 2; width: 40px; height: 40px; padding: 0 0 4px; border: 1px solid rgba(166,108,123,.2); border-radius: 50%; background: rgba(255,255,255,.94); color: #402f34; box-shadow: 0 6px 18px rgba(0,0,0,.1); cursor: pointer; font: 300 1.9rem/1 var(--font-serif); }
        .shop-categories__arrow--left { left: .1rem; transform: translate(-25%,-50%); }
        .shop-categories__arrow--right { right: .1rem; transform: translate(25%,-50%); }
        .shop-categories__hint { display: flex; align-items: center; justify-content: center; gap: .65rem; margin-top: .35rem; color: rgba(0,0,0,.42); font-size: .62rem; letter-spacing: .12em; text-transform: uppercase; }
        .shop-categories__hint span { width: 28px; height: 1px; background: rgba(166,108,123,.35); }
        @media (min-width: 768px) { .shop-categories { padding: 4.5rem 0; } .shop-categories__track { grid-auto-columns: calc(50% - .75rem); gap: 1.5rem; padding: .75rem 2rem 1.2rem; } .shop-categories__arrow--left { left: .75rem; } .shop-categories__arrow--right { right: .75rem; } }
        @media (prefers-reduced-motion: reduce) { .shop-categories__track { scroll-behavior: auto; } .shop-categories__image, .shop-categories__image :global(img) { transition: none; } }
      `}</style>
    </section>
  );
}
