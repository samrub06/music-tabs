import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import CreateFolderWizardClient from './CreateFolderWizardClient'

export default async function CreateFolderPage() {
  noStore()
  const supabase = await createSafeServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const folders = await folderRepo(supabase).getAllFolders()

  return (
    <CreateFolderWizardClient existingNames={folders.map((folder) => folder.name)} />
  )
}
