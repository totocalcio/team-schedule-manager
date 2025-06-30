<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Discord Notifications</h2>
        <p class="text-gray-600">Get automatic notifications when all team members are available tomorrow</p>
      </div>
      <div class="flex items-center space-x-2">
        <MessageSquare class="w-6 h-6 text-indigo-600" />
        <span :class="[
          'px-3 py-1 rounded-full text-sm font-medium',
          (settings?.enabled && isNotificationActive)
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        ]">
          {{ (settings?.enabled && isNotificationActive) ? 'Active' : 'Inactive' }}
        </span>
      </div>
    </div>

    <!-- Settings Form -->
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <Info class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div class="text-sm text-blue-800">
            <p class="font-medium mb-1">How to set up Discord notifications:</p>
            <ol class="list-decimal list-inside space-y-1">
              <li>Create a Discord webhook in your server's channel settings</li>
              <li>Copy the webhook URL and paste it below</li>
              <li>Set your preferred notification time</li>
              <li>Enable notifications to receive automatic daily alerts about tomorrow's 100% availability</li>
              <li>Keep this browser tab open or visit the calendar regularly for notifications to work</li>
            </ol>
          </div>
        </div>
      </div>

      <form @submit.prevent="saveSettings" class="space-y-4">
        <div>
          <label for="webhookUrl" class="block text-sm font-medium text-gray-700 mb-2">
            Discord Webhook URL {{ settings ? '(Update)' : '*' }}
          </label>
          <div v-if="settings && !showWebhookInput" class="space-y-2">
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span class="text-sm text-gray-700">Webhook URL configured</span>
              </div>
              <button
                type="button"
                @click="showWebhookInput = true"
                class="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Update URL
              </button>
            </div>
          </div>
          <div v-else>
            <input
              id="webhookUrl"
              v-model="formData.webhook_url"
              type="url"
              :required="!settings"
              class="input-field"
              placeholder="https://discord.com/api/webhooks/..."
              :disabled="loading"
            />
            <div v-if="settings" class="flex justify-end mt-2">
              <button
                type="button"
                @click="cancelWebhookUpdate"
                class="text-sm text-gray-600 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{ settings ? 'Enter a new webhook URL to update the current one' : 'Create a webhook in your Discord server\'s channel settings' }}
          </p>
        </div>

        <div>
          <label for="notificationTime" class="block text-sm font-medium text-gray-700 mb-2">
            Notification Time *
          </label>
          <input
            id="notificationTime"
            v-model="formData.notification_time"
            type="time"
            required
            class="input-field"
            :disabled="loading"
          />
        </div>

        <div class="flex items-center space-x-3">
          <input
            id="enabled"
            v-model="formData.enabled"
            type="checkbox"
            class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
            :disabled="loading"
          />
          <label for="enabled" class="text-sm font-medium text-gray-700">
            Enable Discord notifications
          </label>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            v-if="settings"
            type="button"
            @click="deleteSettings"
            class="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
            :disabled="loading"
          >
            <Trash2 class="w-4 h-4" />
            <span>Delete Settings</span>
          </button>
          
          <button
            type="submit"
            class="btn-primary flex items-center space-x-2"
            :disabled="loading || !isValidFormForSubmit"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            <span>{{ loading ? 'Saving...' : 'Save Settings' }}</span>
          </button>
        </div>
      </form>

      <!-- Test Notification -->
      <div v-if="settings?.enabled" class="border-t pt-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">Test Notification</h3>
              <p class="text-gray-600 text-sm">Send a test message to verify your webhook</p>
            </div>
            <button
              @click="sendTestNotification"
              class="btn-ghost flex items-center space-x-2"
              :disabled="testLoading"
            >
              <Loader2 v-if="testLoading" class="w-4 h-4 animate-spin" />
              <Send v-else class="w-4 h-4" />
              <span>{{ testLoading ? 'Sending...' : 'Send Test' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="mt-4">
      <div :class="[
        'p-3 rounded-lg',
        message.type === 'success' 
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-red-50 border border-red-200 text-red-800'
      ]">
        {{ message.text }}
        <div v-if="message.details" class="mt-2 text-xs">
          <pre class="whitespace-pre-wrap">{{ JSON.stringify(message.details, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MessageSquare, Info, Save, Trash2, Send, Loader2, Calendar, Clock, AlertTriangle } from 'lucide-vue-next'
import type { DiscordNotificationSettings, CreateDiscordNotificationRequest } from '~/types'
import { useSupabase } from '~/utils/supabase'
import { 
  getUserTimezone, 
  convertDatabaseTimeToUserTime, 
  convertUserTimeToDatabaseTime,
  formatTimezoneInfo,
  getCurrentTimeInTimezone,
  DATABASE_TIMEZONE,
  debugTimezoneConversion
} from '~/utils/timezone'

interface Props {
  calendarId: string
  calendarName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  refresh: []
}>()

const settings = ref<DiscordNotificationSettings | null>(null)
const loading = ref(false)
const testLoading = ref(false)
const manualLoading = ref(false)
const showWebhookInput = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string; details?: any } | null>(null)
const isNotificationActive = ref(false)
const notificationInterval = ref<NodeJS.Timeout | null>(null)
const nextCheckTime = ref<Date | null>(null)
const userTimezoneInfo = ref(getUserTimezone())

// タイムゾーン情報
const currentDatabaseTime = ref('')
const currentUserTime = ref('')

const formData = reactive<CreateDiscordNotificationRequest>({
  calendar_id: props.calendarId,
  webhook_url: '',
  notification_time: '09:00',
  enabled: true
})

const isValidForm = computed(() => {
  return formData.webhook_url.trim() && 
         formData.webhook_url.includes('discord.com/api/webhooks/') &&
         formData.notification_time
})

const isValidFormForSubmit = computed(() => {
  // If updating existing settings and webhook input is not shown, only check other fields
  if (settings.value && !showWebhookInput.value) {
    return formData.notification_time
  }
  // Otherwise, check all fields including webhook URL
  return isValidForm.value
})

// 時刻情報を更新
const updateTimeInfo = () => {
  currentDatabaseTime.value = getCurrentTimeInTimezone(DATABASE_TIMEZONE)
  currentUserTime.value = getCurrentTimeInTimezone(userTimezoneInfo.value.timezone)
}

// デバッグ用の変換情報を表示
const getConversionDebugInfo = computed(() => {
  if (!formData.notification_time) return null
  
  return debugTimezoneConversion(
    formData.notification_time,
    userTimezoneInfo.value.timezone,
    DATABASE_TIMEZONE
  )
})

const getTimeUntilNextCheck = (): string => {
  if (!nextCheckTime.value) return 'calculating...'
  
  const now = new Date()
  const diff = nextCheckTime.value.getTime() - now.getTime()
  
  if (diff <= 0) return 'checking now...'
  
  const minutes = Math.floor(diff / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

const getTimeUntilTarget = (): string => {
  if (!formData.notification_time) return 'Not set'
  
  const now = new Date()
  const [targetHour, targetMin] = formData.notification_time.split(':').map(Number)
  
  // Create target time for today
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMin)
  
  // If target time has passed today, set it for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }
  
  const diff = target.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

const startNotificationSystem = () => {
  if (!settings.value?.enabled || notificationInterval.value) return
  
  console.log('Starting browser-based notification system')
  isNotificationActive.value = true
  
  const checkNotifications = async () => {
    try {
      const now = new Date()
      const notificationTime = settings.value?.notification_time
      
      if (!notificationTime) return
      
      console.log('Checking notification time:', {
        notificationTime,
        currentTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        timezone: userTimezoneInfo.value.timezone
      })
      
      // Check if it's time to send notification (with 2 minute tolerance for reliability)
      const [notifHour, notifMin] = notificationTime.split(':').map(Number)
      const [currentHour, currentMin] = [now.getHours(), now.getMinutes()]
      
      const notifMinutes = notifHour * 60 + notifMin
      const currentMinutes = currentHour * 60 + currentMin
      
      console.log('Time comparison:', {
        notifMinutes,
        currentMinutes,
        difference: Math.abs(currentMinutes - notifMinutes)
      })
      
      // Execute only at exact time (hour and minute must match)
      if (currentHour === notifHour && currentMin === notifMin) {
        console.log('Time to check for notifications!', {
          notificationTime,
          currentTime: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
        })
        await sendManualCheck()
      } else {
        console.log('Not exact time for notifications:', {
          target: `${String(notifHour).padStart(2, '0')}:${String(notifMin).padStart(2, '0')}`,
          current: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
        })
        console.log('Not time yet for notifications')
      }
    } catch (error) {
      console.error('Error in notification check:', error)
    }
  }
  
  // Check every minute
  notificationInterval.value = setInterval(() => {
    checkNotifications()
    // Update next check time display
    nextCheckTime.value = new Date(Date.now() + 60000)
  }, 60000) // Check every 60 seconds
  
  // Set initial next check time
  nextCheckTime.value = new Date(Date.now() + 60000)
  
  // Initial check
  checkNotifications()
}

const stopNotificationSystem = () => {
  if (notificationInterval.value) {
    clearInterval(notificationInterval.value)
    notificationInterval.value = null
  }
  isNotificationActive.value = false
  nextCheckTime.value = null
  console.log('Stopped browser-based notification system')
}

const loadSettings = async () => {
  try {
    const supabase = useSupabase()
    
    const { data, error } = await supabase
      .from('discord_notifications')
      .select('*')
      .eq('calendar_id', props.calendarId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    if (data) {
      settings.value = data
      // Don't populate webhook URL for security
      formData.webhook_url = ''
      // データベース時間（JST）をユーザーのローカル時間に変換
      const dbTime = data.notification_time.substring(0, 5) // HH:MM format
      formData.notification_time = convertDatabaseTimeToUserTime(dbTime, userTimezoneInfo.value.timezone)
      formData.enabled = data.enabled
      
      // Start notification system if enabled
      if (data.enabled) {
        startNotificationSystem()
      }
      
      console.log('Loaded from DB:', {
        dbTime,
        convertedToUserTime: formData.notification_time,
        userTimezone: userTimezoneInfo.value.timezone,
        databaseTimezone: DATABASE_TIMEZONE
      })
    }
  } catch (error) {
    console.error('Error loading Discord settings:', error)
  }
}

const saveSettings = async () => {
  if (!isValidFormForSubmit.value) return
  
  loading.value = true
  message.value = null
  
  try {
    const supabase = useSupabase()
    
    // ユーザーの時間をデータベース時間（JST）に変換
    const databaseTime = convertUserTimeToDatabaseTime(formData.notification_time, userTimezoneInfo.value.timezone)
    
    console.log('Saving settings:', {
      userTime: formData.notification_time,
      databaseTime,
      userTimezone: userTimezoneInfo.value.timezone,
      databaseTimezone: DATABASE_TIMEZONE
    })
    
    const settingsData: any = {
      calendar_id: props.calendarId,
      notification_time: databaseTime, // データベース時間（JST）で保存
      enabled: formData.enabled
    }

    // Only include webhook_url if it's being updated
    if (!settings.value || showWebhookInput.value) {
      if (!formData.webhook_url.trim()) {
        message.value = { type: 'error', text: 'Webhook URL is required' }
        return
      }
      settingsData.webhook_url = formData.webhook_url.trim()
    }

    if (settings.value) {
      // Update existing settings
      const { data, error } = await supabase
        .from('discord_notifications')
        .update(settingsData)
        .eq('id', settings.value.id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      settings.value = data
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('discord_notifications')
        .insert([settingsData])
        .select()
        .single()

      if (error) throw new Error(error.message)
      settings.value = data
    }

    // Reset webhook URL but keep the user's selected time
    formData.webhook_url = ''
    showWebhookInput.value = false
    
    // Start or stop notification system based on enabled status
    if (formData.enabled) {
      startNotificationSystem()
    } else {
      stopNotificationSystem()
    }
    
    message.value = { 
      type: 'success', 
      text: `Discord notification settings saved! ${formData.enabled ? 'Automatic notifications are now active.' : 'Notifications are disabled.'}`
    }
    emit('refresh')
  } catch (error: any) {
    console.error('Error saving Discord settings:', error)
    message.value = { type: 'error', text: error.message || 'Failed to save settings' }
  } finally {
    loading.value = false
  }
}

const deleteSettings = async () => {
  if (!settings.value || !confirm('Are you sure you want to delete Discord notification settings?')) return
  
  loading.value = true
  message.value = null
  
  try {
    const supabase = useSupabase()
    
    const { error } = await supabase
      .from('discord_notifications')
      .delete()
      .eq('id', settings.value.id)

    if (error) throw new Error(error.message)

    settings.value = null
    formData.webhook_url = ''
    formData.notification_time = '09:00'
    formData.enabled = true
    showWebhookInput.value = false
    
    // Stop notification system
    stopNotificationSystem()

    message.value = { type: 'success', text: 'Discord notification settings deleted successfully!' }
    emit('refresh')
  } catch (error: any) {
    console.error('Error deleting Discord settings:', error)
    message.value = { type: 'error', text: error.message || 'Failed to delete settings' }
  } finally {
    loading.value = false
  }
}

const cancelWebhookUpdate = () => {
  formData.webhook_url = ''
  showWebhookInput.value = false
}

const sendTestNotification = async () => {
  if (!settings.value) return
  
  testLoading.value = true
  message.value = null
  
  try {
    const response = await $fetch('/api/discord/test-notification', {
      method: 'POST',
      body: {
        webhook_url: settings.value.webhook_url,
        calendar_name: props.calendarName
      }
    })

    message.value = { type: 'success', text: 'Test notification sent successfully!' }
  } catch (error: any) {
    console.error('Error sending test notification:', error)
    message.value = { type: 'error', text: error.message || 'Failed to send test notification' }
  } finally {
    testLoading.value = false
  }
}

const sendManualCheck = async () => {
  if (!settings.value) return
  
  manualLoading.value = true
  message.value = null
  
  try {
    const response = await $fetch('/api/discord/manual-check', {
      method: 'POST',
      body: {
        calendar_id: props.calendarId
      }
    })

    if (response.notification_sent) {
      message.value = { 
        type: 'success', 
        text: `Manual check completed! Notification sent for ${response.slots_found} available slots.`,
        details: response
      }
    } else {
      message.value = { 
        type: 'success', 
        text: response.message,
        details: response
      }
    }
  } catch (error: any) {
    console.error('Error sending manual check:', error)
    message.value = { type: 'error', text: error.message || 'Failed to perform manual check' }
  } finally {
    manualLoading.value = false
  }
}

// Clear message after 10 seconds (increased for details)
watch(() => message.value, (newMessage) => {
  if (newMessage) {
    setTimeout(() => {
      message.value = null
    }, 10000)
  }
})

// Watch for enabled status changes
watch(() => formData.enabled, (newEnabled) => {
  if (settings.value) {
    if (newEnabled) {
      startNotificationSystem()
    } else {
      stopNotificationSystem()
    }
  }
})

// Update next check time display every second
const updateInterval = ref<NodeJS.Timeout | null>(null)

onMounted(() => {
  // タイムゾーン情報を初期化
  userTimezoneInfo.value = getUserTimezone()
  loadSettings()
  updateTimeInfo()
  
  // 時刻情報を定期更新
  const interval = setInterval(updateTimeInfo, 60000)
  
  // Update next check time display every second
  updateInterval.value = setInterval(() => {
    // Force reactivity update for time display
    if (nextCheckTime.value) {
      nextCheckTime.value = new Date(nextCheckTime.value.getTime())
    }
  }, 1000)
  
  onUnmounted(() => {
    clearInterval(interval)
    if (updateInterval.value) {
      clearInterval(updateInterval.value)
    }
    stopNotificationSystem()
  })
})
</script>