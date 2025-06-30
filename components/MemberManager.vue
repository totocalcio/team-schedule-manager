<template>
  <div class="card">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Team Members</h2>
    
    <!-- Add member form -->
    <div class="bg-gray-50 rounded-lg p-4 mb-6">
      <form @submit.prevent="addMember" class="space-y-4">
        <div>
          <div>
            <label for="memberName" class="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              id="memberName"
              v-model="newMember.name"
              type="text"
              required
              class="input-field"
              placeholder="Enter member name"
            />
          </div>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button
            type="submit"
            :class="[
              'btn-primary flex items-center space-x-2',
              (loading || !newMember.name.trim()) && 'opacity-50 cursor-not-allowed'
            ]"
            :disabled="loading || !newMember.name.trim()"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <UserPlus v-else class="w-4 h-4" />
            <span>{{ loading ? 'Adding Member...' : 'Add Member' }}</span>
          </button>
        </div>
      </form>
    </div>
    
    <!-- Members list -->
    <div v-if="members.length > 0" class="space-y-3">
      <div
        v-for="member in members"
        :key="member.id"
        class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
      >
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-medium">
            {{ member.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <EditableText
              :value="member.name"
              label="member name"
              placeholder="Enter member name"
              text-class="font-medium text-gray-900"
              @update="(newName) => updateMemberName(member.id, newName)"
            />
            <p v-if="member.email" class="text-sm text-gray-600">{{ member.email }}</p>
            <span
              :class="[
                'inline-block px-2 py-1 text-xs rounded-full',
                member.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              ]"
            >
              {{ member.role }}
            </span>
          </div>
        </div>
        
        <button
          @click="deleteMember(member.id)"
          class="text-red-400 hover:text-red-600 transition-colors p-2"
          :title="`Remove ${member.name}`"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <Users class="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Members Yet</h3>
      <p class="text-gray-600">Add team members to start coordinating schedules</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserPlus, Users, Trash2, Loader2 } from 'lucide-vue-next'
import type { Member, CreateMemberRequest } from '~/types'
import { useSupabase } from '~/utils/supabase'

interface Props {
  calendarId: string
  members: Member[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  refresh: []
}>()

const showForm = ref(false)
const loading = ref(false)

const newMember = reactive<CreateMemberRequest>({
  calendar_id: props.calendarId,
  name: '',
  email: '',
  role: 'member'
})

const resetForm = () => {
  newMember.name = ''
  newMember.email = ''
  newMember.role = 'member'
}

const addMember = async () => {
  if (!newMember.name.trim()) return
  
  loading.value = true
  
  try {
    const supabase = useSupabase()
    
    const { data, error } = await supabase
      .from('members')
      .insert([{
        calendar_id: props.calendarId,
        name: newMember.name.trim(),
        email: newMember.email?.trim() || null,
        role: newMember.role || 'member'
      }])
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }
    
    resetForm()
    showForm.value = false
    emit('refresh')
  } catch (error) {
    console.error('Error adding member:', error)
  } finally {
    loading.value = false
  }
}

const deleteMember = async (memberId: string) => {
  if (!confirm('Are you sure you want to remove this member?')) return
  
  try {
    const supabase = useSupabase()
    
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId)
      .eq('calendar_id', props.calendarId)

    if (error) {
      throw new Error(error.message)
    }
    
    emit('refresh')
  } catch (error) {
    console.error('Error deleting member:', error)
  }
}

const updateMemberName = async (memberId: string, newName: string) => {
  if (!newName.trim()) return
  
  try {
    const supabase = useSupabase()
    
    const { data, error } = await supabase
      .from('members')
      .update({ name: newName.trim() })
      .eq('id', memberId)
      .eq('calendar_id', props.calendarId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Update local state
    const memberIndex = props.members.findIndex(m => m.id === memberId)
    if (memberIndex !== -1) {
      props.members[memberIndex].name = newName.trim()
    }
    
    emit('refresh')
  } catch (error: any) {
    console.error('Error updating member name:', error)
    throw error
  }
}
</script>