import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TypePicker({ value, onValueChange, types = [], onAddType }) {
  const [open, setOpen] = useState(false)
  const [newType, setNewType] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddType = () => {
    if (newType.trim()) {
      onAddType?.(newType.trim())
      onValueChange(newType.trim())
      setNewType('')
      setShowAddForm(false)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Select type..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search types..." />
          <CommandList>
            <CommandEmpty>No type found.</CommandEmpty>
            <CommandGroup>
              {types.map((type) => (
                <CommandItem
                  key={type}
                  value={type}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === type ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {type}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => setShowAddForm(!showAddForm)}
                className="text-primary"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add new type
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        
        {showAddForm && (
          <div className="border-t p-3 space-y-2">
            <Label htmlFor="new-type">New Product Type</Label>
            <Input
              id="new-type"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Enter product type"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddType()
                }
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddType} disabled={!newType.trim()}>
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
} 