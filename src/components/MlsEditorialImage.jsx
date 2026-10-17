import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Photo-led editorial frames for MLS's public resource pages.
 * The image area is omitted when the asset has not yet been published.
 * Keep instructional graphics complete by using fit="contain".
 */
export default function MlsEditorialImage({
  name,
  alt,
  className = "",
  imageClassName = "",
  fit = "cover",
  aspect = "aspect-[4/3]",
  priority = false,
  caption,
  expand = false,
  tilt = "left",
}) {
  const [missing, setMissing] = useState(false);
  const reducedMotion = useReducedMotion();
  if (!name || missing) return null;

  const src = `/${name}.webp`;
  const appearance = reducedMotion ? {} : {
    initial: { opacity: 0, y: 26, rotate: tilt === "left" ? -1 : 1 },
    whileInView: { opacity: 1, y: 0, rotate: 0 },
    viewport: { once: true, amount: 0.16 },
    transition: { duration: 0.65, ease: "easeOut" },
    whileHover: { y: -5, rotate: tilt === "left" ? -0.45 : 0.45 },
  };
  const image = (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      onError={() => setMissing(true)}
      className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} ${imageClassName}`}
    />
  );

  return (
    <motion.figure
      {...appearance}
      className={`group relative min-w-0 overflow-hidden rounded-[1.8rem] border border-[#721100]/10 bg-[#f7f3ef] shadow-[0_22px_54px_-30px_rgba(40,16,11,0.42)] transition-shadow duration-300 hover:shadow-[0_28px_66px_-26px_rgba(40,16,11,0.46)] ${className}`}
    >
      <div className={`relative w-full overflow-hidden ${aspect}`}>
        {expand ? (
          <a href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size guide: ${alt}`} className="block h-full w-full cursor-zoom-in focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#dd7d00]">
            {image}
          </a>
        ) : image}
      </div>
      {caption && <figcaption className="px-5 py-3 text-xs font-semibold leading-5 text-[#555]">{caption}</figcaption>}
    </motion.figure>
  );
}
