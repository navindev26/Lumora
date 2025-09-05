import React, { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'

export function TagInput({ value = '', onChange, placeholder = "Add tags..." }) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)

  // Parse tags from string (handles CSV format with quotes)
  const parseTags = (tagString) => {
    if (!tagString) return []
    
    // Handle CSV format with potential quotes
    const tags = tagString.split(',').map(tag => 
      tag.trim().replace(/^["'](.+)["']$/, '$1')
    ).filter(Boolean)
    
    return tags
  }

  // Convert tags array back to string
  const tagsToString = (tags) => {
    return tags.map(tag => `"${tag}"`).join(', ')
  }

  const currentTags = parseTags(value)

  const addTag = (tagToAdd) => {
    const trimmedTag = tagToAdd.trim()
    if (!trimmedTag || currentTags.includes(trimmedTag)) return

    const newTags = [...currentTags, trimmedTag]
    onChange(tagsToString(newTags))
    setInputValue('')
  }

  const removeTag = (tagToRemove) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove)
    onChange(tagsToString(newTags))
  }

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && currentTags.length > 0) {
      removeTag(currentTags[currentTags.length - 1])
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    
    // Auto-add tag on comma
    if (value.includes(',')) {
      const parts = value.split(',')
      const tagToAdd = parts[0].trim()
      if (tagToAdd) {
        addTag(tagToAdd)
      }
      setInputValue(parts.slice(1).join(',').trim())
    } else {
      setInputValue(value)
    }
  }

  // Common supplement tags for suggestions
  const suggestedTags = [
    'Protein', 'Vitamins', 'Minerals', 'Energy', 'Recovery', 'Weight Loss',
    'Muscle Building', 'Immune Support', 'Joint Health', 'Heart Health',
    'Brain Health', 'Antioxidant', 'Natural', 'Organic', 'Vegan', 'Gluten-Free'
  ]

  const availableSuggestions = suggestedTags.filter(tag => 
    !currentTags.includes(tag) && 
    tag.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[42px] bg-background">
        {currentTags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => removeTag(tag)}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={currentTags.length === 0 ? placeholder : "Add more..."}
          className="border-none shadow-none focus-visible:ring-0 flex-1 min-w-[120px] h-6 p-0"
        />
      </div>

      {/* Suggested Tags */}
      {inputValue && availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground">Suggestions:</span>
          {availableSuggestions.slice(0, 5).map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => addTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
} 