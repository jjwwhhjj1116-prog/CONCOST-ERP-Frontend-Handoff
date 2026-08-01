import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  brand?: 'CON_COST' | 'VIET_QS';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', brand = 'CON_COST' }) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/workspace';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {brand === 'VIET_QS' ? (
        <Image
          src={`${basePath}/brand/vietqs-logo.png`}
          alt="VIETQS"
          width={482}
          height={112}
          style={{ objectFit: 'contain', width: '100%', height: '100%' }}
          priority
        />
      ) : (
        <Image
          src={`${basePath}/brand/con-cost-logo.png`}
          alt="(주)컨코스트"
          width={482}
          height={112}
          style={{ objectFit: 'contain', width: '100%', height: '100%' }}
          priority
        />
      )}
    </div>
  );
};
