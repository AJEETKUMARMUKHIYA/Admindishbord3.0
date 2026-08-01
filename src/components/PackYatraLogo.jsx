import React from 'react';
import { Truck } from 'lucide-react';

export default function PackYatraLogo({ 
  size = 'medium', 
  variant = 'light', 
  showSubtitle = true,
  className = '',
  onClick
}) {
  // Size configurations
  const sizes = {
    small: {
      box: 34,
      borderRadius: 10,
      iconSize: 18,
      mainFontSize: '16px',
      subFontSize: '8px',
      gap: '10px',
      subSpacing: '0.8px'
    },
    medium: {
      box: 44,
      borderRadius: 13,
      iconSize: 24,
      mainFontSize: '22px',
      subFontSize: '10px',
      gap: '12px',
      subSpacing: '1.2px'
    },
    large: {
      box: 56,
      borderRadius: 16,
      iconSize: 30,
      mainFontSize: '28px',
      subFontSize: '12px',
      gap: '16px',
      subSpacing: '1.6px'
    }
  };

  const currentSize = typeof size === 'string' ? (sizes[size] || sizes.medium) : sizes.medium;

  // Variant color configurations
  const isDark = variant === 'dark';

  const packColor = isDark ? '#ffffff' : '#1e3b8a'; // Deep Navy Blue or White
  const yatraColor = isDark ? '#f97316' : '#ea580c'; // Vibrant Orange
  const subColor = isDark ? '#cbd5e1' : '#64748b'; // Subtitle Slate Gray

  return (
    <div 
      className={`packyatra-logo-wrapper ${className}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: currentSize.gap,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* Icon Box */}
      <div
        style={{
          width: currentSize.box,
          height: currentSize.box,
          borderRadius: currentSize.borderRadius,
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: isDark 
            ? '0 4px 14px rgba(37, 99, 235, 0.4)' 
            : '0 4px 14px rgba(59, 130, 246, 0.3)',
          flexShrink: 0
        }}
      >
        <Truck size={currentSize.iconSize} strokeWidth={2.2} />
      </div>

      {/* Brand Name & Subtitle */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div 
          style={{ 
            fontSize: currentSize.mainFontSize, 
            fontWeight: 900, 
            lineHeight: 1.05,
            letterSpacing: '-0.3px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span style={{ color: packColor }}>PACK</span>
          <span style={{ color: yatraColor }}>YATRA</span>
        </div>

        {showSubtitle && (
          <div 
            style={{ 
              fontSize: currentSize.subFontSize, 
              fontWeight: 800, 
              color: subColor,
              letterSpacing: currentSize.subSpacing,
              textTransform: 'uppercase',
              marginTop: '3px',
              whiteSpace: 'nowrap'
            }}
          >
            RELOCATION PVT. LTD.
          </div>
        )}
      </div>
    </div>
  );
}
