import { assetPath } from '../utils/assetPath'

const sizeClasses = {
  sm: 'h-7 w-auto max-w-[100px]',
  md: 'h-9 w-auto max-w-[140px]',
  lg: 'h-12 w-auto max-w-[200px]',
  xl: 'h-16 w-auto max-w-[260px]'
}

function BrandLogo({ size = 'md', className = '' }) {
  return (
    <img
      src={assetPath('icons/logo.png')}
      alt="ZCH Footwear Shop"
      className={`object-contain block ${sizeClasses[size] || sizeClasses.md} ${className}`}
    />
  )
}

export default BrandLogo
