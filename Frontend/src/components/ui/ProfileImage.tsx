import React from "react";

interface ProfileImageProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ProfileImage({ 
  src, 
  alt = "Profile", 
  name = "User", 
  size = "md",
  className = "" 
}: ProfileImageProps) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-9 h-9 text-sm",
    lg: "w-28 h-28 text-4xl"
  };

  const handleError = () => {
    setImageError(true);
  };

  const handleLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // Reset error state when src changes
  React.useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoaded(false);
    }
  }, [src]);

  const initials = name.charAt(0).toUpperCase();

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full rounded-xl object-cover shadow-md transition-opacity duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={handleError}
          onLoad={handleLoad}
        />
      ) : null}
      <div 
        className={`w-full h-full rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-md shadow-violet-500/15 ${
          src && !imageError ? 'hidden' : ''
        }`}
      >
        {initials}
      </div>
    </div>
  );
}
