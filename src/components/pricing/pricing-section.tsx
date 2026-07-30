'use client'

import React, { useState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// NEW: Import the subscription logic and regional detection
import { initializePayment } from '@/lib/actions/subscriptions'
import { detectRegion, REGIONAL_PRICES, type BillingRegion } from '@/lib/billing-utils'
import { getUsdRates, type RatesMap } from '@/lib/actions/exchange-rates'

function fmt(usdAmount: number, currency: string, rates: RatesMap) {
  const rate = rates[currency.toLowerCase()] ?? 1
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(usdAmount * rate)
}

interface PricingPlan {
  id: 'free' | 'pro' | 'enterprise' // Match the backend types
  name: string
  price: number
  description: string
  features: string[]
  isPopular?: boolean
}

export function PricingSection() {
  const [loading, setLoading] = useState<string | null>(null)
  const [region, setRegion] = useState<BillingRegion>('global')
  const [rates, setRates] = useState<RatesMap>({})

  // Automatically detect user region on mount
  useEffect(() => {
    setRegion(detectRegion())
    getUsdRates().then(setRates)
  }, [])

  const prices = REGIONAL_PRICES[region]
  const currency = region === 'east_africa' ? 'UGX' : 'USD'

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Starter',
      price: 0,
      description: 'Perfect for getting started and exploring the platform.',
      features: [
        '1 class support',
        'Basic AI analysis',
        'Standard reporting',
        'Community support',
      ],
    },
    {
      id: 'pro',
      name: 'Professional',
      price: prices.monthly, // Dynamic based on region
      description: 'Full access for teachers who want to maximize student impact.',
      features: [
        'Unlimited classes',
        'Advanced AI diagnostic marking',
        'Detailed cognitive profiling',
        'No watermarks on reports',
        'Priority support',
      ],
      isPopular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199, // Custom or fixed high tier
      description: 'Custom solutions for schools and educational organizations.',
      features: [
        'Everything in Professional',
        'School-wide analytics',
        'Custom curriculum integration',
        'Dedicated account manager',
        'SLA & custom contracts',
      ],
    },
  ]

  const handleCheckout = async (planId: 'free' | 'pro' | 'enterprise') => {
    if (planId === 'free') return // Or redirect to dashboard

    setLoading(planId)
    
    try {
      // Initialize the Stripe redirect session
      const res = await initializePayment(
        planId as 'pro' | 'enterprise', 
        'monthly', 
        region
      )

      if (res.error) {
        throw new Error(res.error.message)
      }

      if (res.data?.url) {
        // Redirect to Stripe-hosted checkout page
        window.location.href = res.data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to initialize checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <section className="py-24 px-6 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-transparent px-2 bg-gradient-to-r from-[#926C15] to-primary bg-clip-text">
            Pricing Details
          </h2>
          <p className="text-lg max-w-2xl mx-auto text-neutral-700 dark:text-neutral-300">
            {region === 'east_africa' 
              ? "Special regional pricing enabled for East African educators." 
              : "A Comprehensive Breakdown of Our Pricing Plans to Help You Make the Best Choice!"}
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
                  <span className="text-6xl font-bold tracking-tight">{fmt(plan.price, currency, rates)}</span>
                  <span className="ml-1 text-xl font-medium text-neutral-600 dark:text-neutral-400">/month</span>
                </div>
                <CardDescription className="mt-4 text-neutral-700 dark:text-neutral-400 min-h-[60px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow">
                <Button 
                  disabled={loading !== null}
                  onClick={() => handleCheckout(plan.id)}
                  className={cn(
                    "w-full mb-8 py-6 text-lg font-bold transition-all",
                    plan.isPopular 
                      ? "bg-[#926C15] text-white hover:bg-[#7a5410] dark:bg-[#926C15] dark:text-white dark:hover:bg-[#a87f1d]" 
                      : "bg-transparent border border-neutral-400 dark:border-neutral-600 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  {loading === plan.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : plan.id === 'free' ? (
                    'Current Plan'
                  ) : (
                    'Get Started'
                  )}
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