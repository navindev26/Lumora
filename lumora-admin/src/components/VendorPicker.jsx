import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function VendorPicker({ value, onValueChange, vendors = [], onAddVendor }) {
  const [open, setOpen] = useState(false)
  const [newVendor, setNewVendor] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddVendor = () => {
    if (newVendor.trim()) {
      onAddVendor?.(newVendor.trim())
      onValueChange(newVendor.trim())
      setNewVendor('')
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
          {value || "Select vendor..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search vendors..." />
          <CommandList>
            <CommandEmpty>No vendor found.</CommandEmpty>
            <CommandGroup>
              {vendors.map((vendor) => (
                <CommandItem
                  key={vendor}
                  value={vendor}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === vendor ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {vendor}
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
                Add new vendor
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        
        {showAddForm && (
          <div className="border-t p-3 space-y-2">
            <Label htmlFor="new-vendor">New Vendor Name</Label>
            <Input
              id="new-vendor"
              value={newVendor}
              onChange={(e) => setNewVendor(e.target.value)}
              placeholder="Enter vendor name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddVendor()
                }
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddVendor} disabled={!newVendor.trim()}>
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