import SalesDateRangeCalendar from './SalesDateRangeCalendar'
import { formatDateRange } from '../utils/dateRange'

function SalesDateRangeModal({ isOpen, onClose, startDate, endDate, onRangeChange }) {
  if (!isOpen) return null

  const handleRangeChange = (range) => {
    onRangeChange(range)
    if (range.start && range.end) {
      onClose()
    }
  }

  return (
    <div className="ui-modal-shell">
      <div className="ui-modal-panel max-w-md">
        <div className="ui-modal-header">
          <div className="min-w-0 pr-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Select Date Range</h2>
            <p className="text-sm text-gray-500 mt-1">
              Pick a start day and end day to view sales income.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-touch text-gray-400 hover:text-gray-600 transition-colors shrink-0 flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="ui-modal-body">
          <SalesDateRangeCalendar
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleRangeChange}
          />

          {(startDate || endDate) && (
            <p className="text-sm text-gray-600 mt-4 text-center">
              {startDate && !endDate && 'Now select an end day'}
              {startDate && endDate && (
                <>Selected: <span className="font-medium text-gray-900">{formatDateRange(startDate, endDate)}</span></>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SalesDateRangeModal
