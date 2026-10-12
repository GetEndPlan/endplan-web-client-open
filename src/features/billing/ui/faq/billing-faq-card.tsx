import { Card } from '@/shared/ui'

export function BillingFaqCard() {
  return (
    <Card>
      <Card.Header
        title="Frequently Asked Questions"
      />
      <Card.Body>
        <div className="space-y-4">
          <div>
            <h4 className="typo-emphasis text-gray-900 dark:text-gray-100">
              Can I cancel anytime?
            </h4>
            <p className="mt-1 typo-body-sm text-gray-500 dark:text-gray-400">
              Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="typo-emphasis text-gray-900 dark:text-gray-100">
              How do I manage my subscription?
            </h4>
            <p className="mt-1 typo-body-sm text-gray-500 dark:text-gray-400">
              Click "Manage Subscription" to access the billing portal where you can update payment methods, change plans, or cancel.
            </p>
          </div>
          <div>
            <h4 className="typo-emphasis text-gray-900 dark:text-gray-100">
              Is my payment information secure?
            </h4>
            <p className="mt-1 typo-body-sm text-gray-500 dark:text-gray-400">
              Yes! All payments are processed securely through Polar, our payment provider. We never store your credit card information.
            </p>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}
