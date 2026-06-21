const sizeConfig = {
  sm: {
    zach: 'text-base leading-none',
    apparel: 'text-[9px] sm:text-[10px] tracking-[0.35em] mt-0.5'
  },
  md: {
    zach: 'text-xl leading-none',
    apparel: 'text-[11px] tracking-[0.35em] mt-0.5'
  },
  lg: {
    zach: 'text-3xl leading-none',
    apparel: 'text-sm tracking-[0.4em] mt-1'
  },
  xl: {
    zach: 'text-4xl sm:text-5xl leading-none',
    apparel: 'text-base tracking-[0.4em] mt-1'
  }
}

const variantConfig = {
  light: {
    zach: 'text-slate-900',
    apparel: 'text-slate-400'
  },
  dark: {
    zach: 'text-white',
    apparel: 'text-blue-200/80'
  }
}

function BrandLogo({ size = 'md', variant = 'light', className = '' }) {
  const sizes = sizeConfig[size] || sizeConfig.md
  const colors = variantConfig[variant] || variantConfig.light

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`} aria-label="Zach Apparel">
      <span className={`font-bold italic ${sizes.zach} ${colors.zach}`}>ZACH</span>
      <span className={`font-normal uppercase ${sizes.apparel} ${colors.apparel}`}>APPAREL</span>
    </div>
  )
}

export default BrandLogo
