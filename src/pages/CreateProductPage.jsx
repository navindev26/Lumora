import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProductCreationFlow } from '../components/ProductCreationFlow'
import { ArrowLeftIcon, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function CreateProductPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                AI-Powered Product Creation
              </h1>
              <p className="text-muted-foreground">Upload images and let AI create professional product listings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <ProductCreationFlow 
            onFormDataUpdate={() => {}}
            onProductCreated={() => {
              toast.success('Product created successfully!')
              navigate('/dashboard')
            }}
            onProductAdded={(product) => {
              console.log('Product added:', product)
              toast.success('Product added to dashboard!', {
                description: 'The product has been added successfully.'
              })
              navigate('/dashboard')
            }}
          />
        </div>
      </div>
    </div>
  )
}
