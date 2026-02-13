'use client'

import React, { useCallback, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { startCheckoutSession } from '@/app/actions/stripe'
import { PRODUCTS } from '@/lib/products'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Define the structure for our pricing plans
interface PricingPlan {
  id: string
  name: string
  price: string
  description: string
  features: string[]
  isPopular?: boolean
}

const plans: PricingPlan[] = [
  {
    id: 'starter-plan',
    name: 'Starter',
    price: '99',
    description: 'Recommended for people with at least 1 year experience in crypto markets.',
    features: [
      '1 user account',
      '24 transactions per month',
      '16 altcoin pairs',
      'Basic AI analysis of markets',
      'Build-in wallet API for your crypto',
    ],
  },
  {
    id: 'professional-plan',
    name: 'Professional',
    price: '199',
    description: 'Best for large business owners, startups who need a landing page for their business.',
    features: [
      '1 user account',
      'Unlimited transactions per month',
      'Unlimited altcoin pairs',
      'Advanced AI analysis of markets',
      'Build-in wallet API for your crypto',
    ],
    isPopular: true,
  },
  {
    id: 'enterprise-plan',
    name: 'Enterprise',
    price: '299',
    description: 'Best for large business owners, startups who need a landing page for their business.',
    features: [
      'Unlimited users account',
      'Unlimited transactions per month',
      'Unlimited altcoin pairs',
      'Advanced AI analysis of market by expert',
      'Build-in wallet API for your crypto',
    ],
  },
]

export function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handleCheckout = useCallback((productId: string) => {
    setSelectedPlan(productId)
  }, [])

  // Show checkout modal if a plan is selected
  if (selectedPlan) {
    return (
      <section className="py-24 px-6 bg-white dark:bg-neutral-950">
        <div className="max-w-2xl mx-auto">
          <Button 
            onClick={() => setSelectedPlan(null)}
            variant="outline"
            className="mb-6"
          >
            ← Back to Plans
          </Button>
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ 
              clientSecret: async () => {
                const clientSecret = await startCheckoutSession(selectedPlan)
                return clientSecret || ''
              }
            }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 px-6 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-transparent px-2 bg-gradient-to-r from-[#926C15] to-primary bg-clip-text">
            Pricing Details
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-neutral-700 dark:text-neutral-300">
            A Comprehensive Breakdown of Our Pricing Plans to Help You Make the Best Choice!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={cn(
                "flex flex-col transition-all duration-300 bg-gradient-to-b dark:from-neutral-900 from-neutral-100 dark:to-neutral-950 to-white border-neutral-300 dark:border-neutral-700 hover:border-[#926C15]/50",
                plan.isPopular && "border-[#926C15] ring-1 ring-[#926C15] dark:border-[#926C15]"
              )}
            >
              <CardHeader>
                <CardTitle className="text-2xl text-neutral-900 dark:text-white">{plan.name}</CardTitle>
                <div className="mt-4 flex items-baseline text-neutral-900 dark:text-white">
                  <span className="text-3xl font-semibold">$</span>
                  <span className="text-6xl font-bold tracking-tight">{plan.price}</span>
                  <span className="ml-1 text-xl font-medium text-neutral-600 dark:text-neutral-400">/month</span>
                </div>
                <CardDescription className="mt-4 text-neutral-700 dark:text-neutral-400 min-h-[60px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <Button 
                  onClick={() => handleCheckout(plan.id)}
                  className={cn(
                    "w-full mb-8 py-6 text-lg font-bold transition-all",
                    plan.isPopular 
                      ? "bg-[#926C15] text-white hover:bg-[#7a5410] dark:bg-[#926C15] dark:text-white dark:hover:bg-[#a87f1d]" 
                      : "bg-transparent border border-neutral-400 dark:border-neutral-600 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  Get Started
                </Button>

                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="mt-1 h-5 w-5 rounded-full border border-neutral-400 dark:border-neutral-600 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-[#926C15]" />
                      </div>
                      <span className="text-neutral-700 dark:text-neutral-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
