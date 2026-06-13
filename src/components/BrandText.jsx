const sizeStyles = {
  sm: {
    title: 'text-xl',
    subtitle: 'text-[9px] tracking-[0.32em]'
  },
  md: {
    title: 'text-2xl',
    subtitle: 'text-[10px] tracking-[0.35em]'
  },
  lg: {
    title: 'text-3xl',
    subtitle: 'text-xs tracking-[0.38em]'
  }
}

function BrandText({ size = 'md', variant = 'light', className = '' }) {
  const styles = sizeStyles[size] || sizeStyles.md
  const isDark = variant === 'dark'

  return (
    <div className={`leading-none select-none ${className}`}>
      <p
        className={`${styles.title} font-black italic tracking-tighter ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}
      >
        ZACH
      </p>
      <p
        className={`${styles.subtitle} font-semibold uppercase mt-1 ${
          isDark ? 'text-white/85' : 'text-slate-500'
        }`}
      >
        Apparel
      </p>
    </div>
  )
}

export default BrandText
