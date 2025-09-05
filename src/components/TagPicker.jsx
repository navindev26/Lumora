import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, TagIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TagPicker({ value = '', onChange, placeholder = "Add tags..." }) {
  const [open, setOpen] = useState(false)
  const [customTag, setCustomTag] = useState('')

  // Parse tags from string (handles CSV format with quotes)
  const parseTags = (tagString) => {
    if (!tagString) return []
    return tagString.split(',').map(tag => 
      tag.trim().replace(/^["'](.+)["']$/, '$1')
    ).filter(Boolean)
  }

  // Convert tags array back to string
  const tagsToString = (tags) => {
    return tags.map(tag => `"${tag}"`).join(', ')
  }

  const currentTags = parseTags(value)

  // Predefined supplement tags
  const predefinedTags = [
    'Protein', 'Vitamins', 'Minerals', 'Energy', 'Recovery', 'Weight Loss',
    'Muscle Building', 'Immune Support', 'Joint Health', 'Heart Health',
    'Brain Health', 'Antioxidant', 'Natural', 'Organic', 'Vegan', 'Gluten-Free',
    'Non-GMO', 'Sugar-Free', 'Keto', 'Paleo', 'Sports Nutrition', 'Pre-Workout',
    'Post-Workout', 'Fat Burner', 'Amino Acids', 'Creatine', 'BCAA', 'Omega-3',
    'Probiotics', 'Digestive Health', 'Sleep Support', 'Stress Relief'
  ]

  const availableTags = predefinedTags.filter(tag => !currentTags.includes(tag))

  const addTag = (tagToAdd) => {
    const trimmedTag = tagToAdd.trim()
    if (!trimmedTag || currentTags.includes(trimmedTag)) return

    const newTags = [...currentTags, trimmedTag]
    onChange(tagsToString(newTags))
  }

  const removeTag = (tagToRemove) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove)
    onChange(tagsToString(newTags))
  }

  const addCustomTag = () => {
    if (customTag.trim()) {
      addTag(customTag.trim())
      setCustomTag('')
      setOpen(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Current Tags Display */}
      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {currentTags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
            <TagIcon className="h-3 w-3" />
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent ml-1"
              onClick={() => removeTag(tag)}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        
        {currentTags.length === 0 && (
          <span className="text-muted-foreground text-sm italic">No tags selected</span>
        )}
      </div>

      {/* Tag Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2">
              <TagIcon className="h-4 w-4" />
              {placeholder}
            </span>
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              
              {/* Popular Tags */}
              <CommandGroup heading="Popular Tags">
                {availableTags.slice(0, 12).map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => {
                      addTag(tag)
                      setOpen(false)
                    }}
                  >
                    <TagIcon className="mr-2 h-4 w-4" />
                    {tag}
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* All Available Tags */}
              {availableTags.length > 12 && (
                <CommandGroup heading="All Tags">
                  {availableTags.slice(12).map((tag) => (
                    <CommandItem
                      key={tag}
                      value={tag}
                      onSelect={() => {
                        addTag(tag)
                        setOpen(false)
                      }}
                    >
                      <TagIcon className="mr-2 h-4 w-4" />
                      {tag}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandSeparator />
              
              {/* Custom Tag Input */}
              <CommandGroup>
                <div className="p-2 space-y-2">
                  <Label htmlFor="custom-tag" className="text-xs">Add Custom Tag</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-tag"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      placeholder="Enter custom tag"
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addCustomTag()
                        }
                      }}
                    />
                    <Button 
                      type="button"
                      size="sm" 
                      onClick={addCustomTag} 
                      disabled={!customTag.trim()}
                      className="h-8 px-3"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
} 