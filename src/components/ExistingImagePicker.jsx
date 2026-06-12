import { useMemo, useState } from 'react'

const INITIAL_VISIBLE = 6

function ImageSection({ label, items, selectedImage, onSelect }) {
  const [showAll, setShowAll] = useState(false)

  const imageOptions = useMemo(() => {
    const seen = new Set()
    const options = []

    for (const item of items) {
      const image = item?.image?.trim()
      if (!image || seen.has(image)) continue
      seen.add(image)
      options.push({
        image,
        name: item.name || 'Untitled'
      })
    }

    return options
  }, [items])

  if (imageOptions.length === 0) return null

  const visibleOptions = showAll ? imageOptions : imageOptions.slice(0, INITIAL_VISIBLE)
  const hiddenCount = imageOptions.length - INITIAL_VISIBLE

  return (
    <div className="mb-4 last:mb-0">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {visibleOptions.map((option) => (
          <button
            key={option.image}
            type="button"
            onClick={() => onSelect(option.image)}
            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
              selectedImage === option.image
                ? 'border-primary-blue ring-2 ring-primary-blue ring-offset-2'
                : 'border-gray-300 hover:border-primary-blue'
            }`}
            title={option.name}
          >
            <img
              src={option.image}
              alt={option.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML =
                  '<div class="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400 px-1 text-center">No image</div>'
              }}
            />
          </button>
        ))}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-2 text-sm text-primary-blue hover:text-[#357abd] font-medium"
        >
          {showAll ? 'Show less' : `Show more (${hiddenCount} more)`}
        </button>
      )}
    </div>
  )
}

function ExistingImagePicker({ sections = [], selectedImage, onSelect }) {
  const hasAnyImages = sections.some((section) =>
    section.items?.some((item) => item?.image?.trim())
  )

  if (!hasAnyImages) {
    return (
      <p className="text-xs text-gray-400 italic">
        No images yet. Add a product or category with an image, or enter a URL above.
      </p>
    )
  }

  return (
    <div>
      {sections.map((section) => (
        <ImageSection
          key={section.label}
          label={section.label}
          items={section.items}
          selectedImage={selectedImage}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

export default ExistingImagePicker
