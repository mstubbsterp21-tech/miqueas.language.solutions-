import { useState } from "react";

// Keeps the existing layout intact until the matching photo is present in /public/images/mls.
export default function MlsSitePhoto({ name, alt, className = "", priority = false }) {
  const [failed, setFailed] = useState(false);
  if (!name || failed) return null;
  return (
    <img
      src={`/images/mls/${name}.png`}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      onError={() => setFailed(true)}
      className={`block w-full rounded-[1.25rem] object-cover ${className}`}
    />
  );
}
