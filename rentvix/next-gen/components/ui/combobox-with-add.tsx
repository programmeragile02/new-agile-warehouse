"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface ComboboxWithAddProps {
  options: string[]
  value: string
  onValueChange: (value: string) => void
  onAddOption: (option: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  addText?: string
  className?: string
}

export function ComboboxWithAdd({
  options,
  value,
  onValueChange,
  onAddOption,
  placeholder = "Select option...",
  searchPlaceholder = "Search options...",
  emptyText = "No option found.",
  addText = "Add",
  className,
}: ComboboxWithAddProps) {
  const [open, setOpen] = React.useState(false)
  const [newOption, setNewOption] = React.useState("")
  const [showAddInput, setShowAddInput] = React.useState(false)

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      onAddOption(newOption.trim())
      onValueChange(newOption.trim())
      setNewOption("")
      setShowAddInput(false)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className={cn("justify-between", className)}>
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>
              <div className="p-2">
                <p className="text-sm text-muted-foreground mb-2">{emptyText}</p>
                {!showAddInput ? (
                  <Button variant="outline" size="sm" onClick={() => setShowAddInput(true)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {addText} new option
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new option"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddOption()}
                      className="h-8"
                    />
                    <Button size="sm" onClick={handleAddOption} className="h-8">
                      {addText}
                    </Button>
                  </div>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                  {option}
                </CommandItem>
              ))}
              {options.length > 0 && (
                <CommandItem onSelect={() => setShowAddInput(true)} className="border-t">
                  <Plus className="mr-2 h-4 w-4" />
                  {addText} new option
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
