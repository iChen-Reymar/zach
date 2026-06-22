import { useState } from 'react'
import {
  getCalendarDays,
  isDateInRange,
  isSameDay,
  toDateKey
} from '../utils/dateRange'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function SalesDateRangeCalendar({ startDate, endDate, onRangeChange }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(() => startDate || today)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const days = getCalendarDays(year, month)

  const handleDayClick = (date) => {
    if (!startDate || (startDate && endDate)) {
      onRangeChange({ start: date, end: null })
      return
    }

    if (isSameDay(date, startDate)) {
      onRangeChange({ start: date, end: date })
      return
    }

    if (date < startDate) {
      onRangeChange({ start: date, end: startDate })
      return
    }

    onRangeChange({ start: startDate, end: date })
  }

  const goToPreviousMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="ui-touch p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h3>
        <button
          type="button"
          onClick={goToNextMonth}
          className="ui-touch p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Click a start day, then click an end day to view income for that range.
      </p>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const inRange = isDateInRange(date, startDate, endDate)
          const isStart = isSameDay(date, startDate)
          const isEnd = isSameDay(date, endDate)
          const isToday = isSameDay(date, today)

          return (
            <button
              key={toDateKey(date)}
              type="button"
              onClick={() => handleDayClick(date)}
              className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                inRange
                  ? 'bg-primary-blue text-white'
                  : isToday
                    ? 'bg-blue-50 text-primary-blue border border-primary-blue'
                    : 'text-gray-700 hover:bg-gray-100'
              } ${isStart || isEnd ? 'ring-2 ring-primary-blue ring-offset-1' : ''}`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SalesDateRangeCalendar
