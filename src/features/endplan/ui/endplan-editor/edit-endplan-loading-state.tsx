export function EditEndPlanLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ep-primary dark:border-ep-primary-accent mx-auto" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Decrypting your EndPlan...</p>
      </div>
    </div>
  )
}
